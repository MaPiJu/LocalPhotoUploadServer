// Fichier servant à créer un serveur sur le raspeberry receptionnant les photos

// Importe le module "Express" -> permet de gérer les routes HTTP
const express = require('express')

// "Multer" est une librairie qui permet de recevoir et enregistrer des fichiers, 
// idéal pour des photos
const multer = require('multer')

// Path -> manipule les chemins; File, lit, crée, écrit des fichiers
const path = require('path')
const fs = require('fs')

// On appelle express-zip pour télécharger plusieurs images à la fois
const zip = require('express-zip')

// On itnitialise l'application, qui est une application "Express" -> donc http
// Plus, on intitialise le PORT
const app = express()
const PORT = 3000

const cors = require('cors');

const allowedOrigins = [
  'http://192.168.178.114:5173',
  'http://localhost:5173',
  'http://clernstpi.local:5173'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('CORS non autorisé : ' + origin));
    }
  }
}));

// permet à Express de parser automatiquement le body JSON dans toutes tes requêtes POST.
app.use(express.json())



// DOSSIER DE DESTINATION
// On configure un fichier de stockage, s'il n'existe pas, on le crée
const storagePath = path.join(__dirname, 'photos')
if (!fs.existsSync(storagePath)){
    fs.mkdirSync(storagePath, {recursive: true})
}


// DEBUT DE CONFIGURATION DE MULTER
// Ici on configure le storage du fichier que l'on recevra c'est à dire de la photo
const storage = multer.diskStorage({
    // Endroit où l'on sauvegarde
    destination: storagePath,
    // Fonction fléchée avec pour argument "req" "file" "cb" qui donne un nx nom à l'image
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '_' + file.originalname

        // "cb" -> "callback" fct de rappel pour dire à multer quel est le nouveau nom du fichier
        // car Multer ne définit pas de nom automatiquement
        cb(null, uniqueName)
    }
})


// FIN DE CONFIGURATION DE MULTER
// initialisation de notre objet multer qui recevra les photos
const upload = multer({storage})


// ROUTE "POST" POUR UPLOAD LA PHOTO DANS NOTRE RASPBERRY
// Notre app attend ici une reqête POST
app.post('/upload', upload.array('photo'), (req, res) => {
  if (!req.files?.length) return res.status(400).json({ ok:false, error:'Aucun fichier reçu' });
  res.status(201).json({
    ok:true,
    count: req.files.length,
    files: req.files.map(f => f.filename),
  });
});



// DÉBUT DU CODE POUR SERVIR EN AFFICHAGE LES PHOTOS UPLOADÉS AU FRONT-END
// Middleware: lit le dossier "photos"
function getDirectoryContent(req, res, next) {
  fs.readdir(storagePath, (err, files) => {
    if (err) return next(err);
    res.locals.files = files;
    next();
  });
}

// Endpoint dédié pour la liste JSON (ex: GET http://localhost:3000/images)
// où l'on peut lire les images
app.get('/images', getDirectoryContent, (req, res) => {
  const items = res.locals.files.map(name => ({
    filename: name,
    url: `/photos/${name}`, // URL utilisable côté front <img src={...} />
  }));
  res.json({ ok: true, total: items.length, items });
});

// FIN DU CODE POUR SERVIR EN AFFICHAGE LES PHOTOS UPLOADÉS AU FRONT-END

// DÉBUT DU CODE POUR TÉLÉCHARGER LES IMAGES

// 1) On a qu'une seule image à télécharger
app.get('/download', (req, res) => {
  res.download(path.join(storagePath, req.query.file))
});

// 2) On a plusieurs images à télécharger -> On utilise zip
app.post('/downloads', (req, res) => {
  console.log('📦 Fichiers reçus pour zip :', req.body);
  const arrayZIP = req?.body?.files?.map(
    filename => 
      ({path: path.join(storagePath, filename),
        name: filename
      }))
  
  res.zip(arrayZIP)
});

// FIN DU CODE POUR TÉLÉCHARGER LES IMAGES

// DÉBUT DU CODE POUR SUPPRIMER DES ELEMENTS DU SERVEUR
app.delete('/images/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(storagePath, filename);

  fs.unlink(filePath, err => {
    if (err) {
      console.error('Erreur suppression fichier:', err);
      return res.status(500).json({ ok: false, error: 'Erreur suppression' });
    }
    res.json({ ok: true, deleted: filename });
  });
});
// FIN DU CODE POUR SUPPRIMER DES ELEMENTS DU SERVEUR


// SERVIR LES FICHIERS STATIQUES AVEC CACHE
// SERVIR LES FICHIERS EN STATIQUE (on va chercher les photos dans "photos", puis les exposer
// dans une URL via http/local/public/img001.jpg)
app.use('/photos', express.static(storagePath, {
  maxAge: '1h', // ⏰ durée du cache navigateur
  etag: true    // ✅ permet au navigateur de vérifier si le fichier a changé
}));


// DEBUT DU TEST POUR SAVOIR SI LE SERVEUR TOURNE
app.get('/', (req,res) => {
    res.send('Seveur Local Test prêt à recevoir des photos 📸')
})


// IDENTIFICATION DE L'ERREUR 500
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);           // log complet
  const status = err.status || 500;
  res.status(status).json({ ok: false, error: err.message || 'Server error' });
});


// LANCEMENT DU SERVEUR
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur en ligne sur http://clernstpi.local:${PORT}`)
})