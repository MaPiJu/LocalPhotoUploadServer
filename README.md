# Photo Uploader

Système complet pour uploader, consulter, télécharger et supprimer des photos depuis un iPhone ou un navigateur web, via un serveur local (Raspberry Pi).

## Architecture

```
server/     → Serveur Node.js/Express (tourne sur Raspberry Pi)
web-app/    → Application React/Vite (navigateur)
ios-app/    → Application iOS SwiftUI (iPhone)
```

---

## server/ — Serveur Node.js

Tourne sur le Raspberry Pi et expose une API REST pour gérer les photos.

### Routes

| Méthode | Route | Description |
|--------|-------|-------------|
| `POST` | `/upload` | Upload une ou plusieurs photos (multipart/form-data, champ `photo`) |
| `GET` | `/images` | Liste toutes les photos stockées (JSON) |
| `GET` | `/download?file=nom.jpg` | Télécharge une photo unique |
| `POST` | `/downloads` | Télécharge plusieurs photos en ZIP (`{ files: ["a.jpg", "b.jpg"] }`) |
| `DELETE` | `/images/:filename` | Supprime une photo du serveur |
| `GET` | `/photos/:filename` | Sert les fichiers statiques (URL directe pour affichage) |

### Lancer le serveur

```bash
cd server
npm install
npm start
# Serveur disponible sur http://<IP_RASPBERRY>:3000
```

### Configuration

L'IP du Raspberry Pi est à adapter dans les 3 parties du projet. Actuellement configurée sur `192.168.178.114`.

---

## web-app/ — Application React/Vite

Interface web pour uploader des photos depuis un ordinateur et gérer les photos stockées sur le serveur.

### Fonctionnalités

- Sélection et prévisualisation de photos avant upload
- Upload vers le serveur (photos cochées)
- Affichage de la galerie du serveur
- Téléchargement individuel ou en ZIP
- Suppression depuis le serveur
- Slideshow des photos sélectionnées

### Lancer la web app

```bash
cd web-app
npm install
npm run dev
# Disponible sur http://localhost:5173
```

---

## ios-app/ — Application iOS SwiftUI

Application iPhone pour uploader et gérer les photos directement depuis la photothèque.

### Fonctionnalités

- Sélection jusqu'à 10 photos depuis la photothèque
- Prévisualisation en scroll horizontal
- Upload vers le serveur en multipart/form-data
- Galerie du serveur en grille
- Téléchargement vers la pellicule
- Suppression depuis le serveur

### Lancer l'app iOS

Ouvrir `ios-app/PhotoUploader.xcodeproj` dans Xcode, sélectionner un simulateur ou un iPhone, puis lancer.

---

## Configuration réseau

L'IP du serveur est codée en dur dans les fichiers suivants — à modifier si l'adresse du Raspberry Pi change :

- `web-app/src/App.jsx` — ligne `const rasp = "192.168.178.114"`
- `ios-app/PhotoUploader/ContentView.swift` — ligne `URL(string: "http://192.168.178.114:3000/upload")`
- `ios-app/PhotoUploader/ServerGalleryView.swift` — ligne `let baseURL = "http://192.168.178.114:3000"`
- `server/server.js` — liste `allowedOrigins` pour le CORS
