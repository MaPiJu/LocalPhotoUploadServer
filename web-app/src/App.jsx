import { useState } from 'react'
import { Header } from "./components/Header"
import { InputTab} from"./components/InputTab"
import { ImageListToAdd } from "./components/ImageListToAdd"
import { UploadPopup } from './components/UploadPopup'
import { ServerButtonsTab } from './components/ServerButtonsTab'
import useImageListManager from './functions/useImageListManager'
import { SlideShowPopup } from './components/SlideShowPopup'

// QUAND CECI DISPARAIT ALORS IL Y ICI TOUT CE QU IL FALLAIT POUR FONCTIONNER

function App() {
// Remplacer localhost par http://clernstpi.local:3000/ quand on utilise raspberry
const isRaspberry = true
const rasp = "192.168.178.114"
const pc = "localhost"

let domainName = isRaspberry ? rasp : pc

// Constante pour définir où l'on poste nos images
const RPI_UPLOAD_URL = `http://${domainName}:3000/upload`

// Constante pour définir où l'on récupère nos images
const RPI_SHOW_URL = `http://${domainName}:3000/images`

// Constante pour définir où l'on télécharge une image
const RPI_DOWNLOAD_URL = `http://${domainName}:3000/download`

// Constante pour définir où l'on télécharge plusieurs
const RPI_DOWNLOADS_URL = `http://${domainName}:3000/downloads`

// Liste des images à uplaoder
const {
  images: imagesToUpload,
  addImages: addImagesToUpload,
  setImages: setImagesToUpload,
  deleteChecked: deleteUploadImages,
  handleAllSelectDeselect: handleAllSelectDeselectUploadImages,
  toggleImage: toggleUploadImage,
} = useImageListManager()

// Liste des images à récupérer du serveur
const {
  images: imagesFromServer,
  addImages: addImagesFromServer,
  setImages: setImagesFromServer,
  deleteChecked: hideFromServer,
  handleAllSelectDeselect: handleAllSelectDeselectFromServer,
  toggleImage: toggleFromServer,
} = useImageListManager()


// Check si on est en upload
const [isUploading, setIsUploading] = useState(false)

// Check si on a un popup pour l'Upload
const [showUploadPopup, setShowUploadPopup] = useState(false)

// Message du popup pour l'Upload
const [popupMessage, setPopupMessage] = useState("")

// Check si on a un popup pour le Slide Show
const [showSlidePopup, setShowSlidePopup] = useState(false)

// Liste d'images du popup pour le Slide Show
const [popupSlideImages, setPopupSlideImages] = useState([])


// Fonction pour le bouton show slide
function slideShowFunction(img){
  const imagesToSlide = img.filter(img => img.checked === true)
  if (imagesToSlide.length === 0) return
  setPopupSlideImages(imagesToSlide)
  setShowSlidePopup(true)
}


// Fonction asynchrone afin de poster les images
async function sendFormData() {
  const imagesToSend = imagesToUpload.filter(img => img.checked === true)
  if (imagesToSend.length === 0) return

  const controller = new AbortController() // 🧠 permet d’annuler le fetch
  const timeout = setTimeout(() => controller.abort(), 5000) // ⏰ 5s max

  setIsUploading(true)

  const formData = new FormData()
  imagesToSend.forEach(image => {
    formData.append("photo", image.input) // ou "photo[]" selon le backend
  })

  try {
    const res = await fetch(RPI_UPLOAD_URL, { method: "POST", body: formData, signal: controller.signal })

    // Essaie de lire la réponse (même en erreur), mais sans casser si ce n'est pas du JSON
    let data = null
    try { data = await res.json() } catch { /* pas de JSON */ }
    console.log("Réponse du serveur:", data ?? res.statusText)

    if (res.ok) {
      // ⚠️ Ici on enlève du state celles qui ont été envoyées (les cochées)
      setImagesToUpload(prev => prev.filter(img => !img.checked))
      setPopupMessage(`✅ Succès : ${res.status}`)
      setShowUploadPopup(true)
    } 
     else {
      setPopupMessage(`❌ Erreur HTTP ${res.status}`)
      setShowUploadPopup(true)
    }

  } catch (err) {
    if (err.name === "AbortError"){
      setPopupMessage("⏰ Timeout : la requête a été annulée après 5 secondes")
    } else {
    setPopupMessage(`⚠️ Erreur réseau : ${err.message}`)
    }
    setShowUploadPopup(true)
  } finally {
    clearTimeout(timeout)
    setIsUploading(false)
  }
}

// Fonction asynchrone afin de récupérer les images
async function getImagesFromServer(){
  const controller = new AbortController() // 🧠 permet d’annuler le fetch
  const timeout = setTimeout(() => controller.abort(), 5000) // ⏰ 5s max
  setIsUploading(true)

  try {
    // signal -> sert au timer
    const res = await fetch(RPI_SHOW_URL, {signal: controller.signal })

    // Essaie de lire la réponse (même en erreur), mais sans casser si ce n'est pas du JSON
    let data = null
    try { data = await res.json() } catch { console.log(res) }
    
    // Teste à la fois le statut HTTP et le champ ok du JSON.
    if (res.ok && data?.ok) {
      // Sauvegarde nos photos récupérées
      const normalized = data.items.map(img => ({
            input: null,
            checked: true,
            id: img.filename,
            url: `http://${domainName}:3000${img.url}`,
            filename: img.filename,
          }))
      setImagesFromServer(normalized || [])
    } 
     else {
      setPopupMessage(`❌ Erreur HTTP ${res.status}`)
      setShowUploadPopup(true)
    }

  } catch (err) {
    if (err.name === "AbortError"){
      setPopupMessage("⏰ Timeout : le téléchargement a été annulée après 5 secondes")
    } else {
    setPopupMessage(`⚠️ Erreur réseau : ${err.message}`)
    }
    setShowUploadPopup(true)
  } finally {
    clearTimeout(timeout)
    setIsUploading(false)
  }
}


// Fonction qui télécharge sur l'ordinateur les photos du serveur:
async function downloadImagesFromServer(){

  const toDownload = imagesFromServer.filter(img => img.checked)

  // On a aucune image à télécharger
  if (toDownload.length === 0) return

  // On a qu'une seule image à télécharger
  if (toDownload.length === 1){

    const image = toDownload[0]
    const downloadURL = `${RPI_DOWNLOAD_URL}?file=${image.filename}`
    const resOne = await fetch(downloadURL)

    if (resOne.ok){
      var a = document.createElement('a')
      a.href = downloadURL
      a.download = image.id
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)}
    
  }
  // On a plusieurs images à télécharger
  else {
    const listToSend = toDownload.map(elt => elt.filename)
    const jsonList = {files: listToSend}

    const resMultiple = await fetch(
      RPI_DOWNLOADS_URL, 
      { headers: {"Content-Type": "application/json"}, method: "POST", body: JSON.stringify(jsonList)})
    
    let zipBlob = null
    try { zipBlob = await resMultiple.blob() } catch { /* pas de BLOB */ }
    
    if (resMultiple.ok){
      const url = window.URL.createObjectURL(zipBlob)
      const zipDownload = document.createElement("a")

      zipDownload.href = url
      zipDownload.download = `images-download-${Date.now()}.zip`
      document.body.appendChild(zipDownload)
      zipDownload.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(zipDownload)

    }

  }
}


// Fonction asynchrone qui supprime du serveur les photos sélectionnés avec le ticker
async function delImagesFromServer() {
  const toDelete = imagesFromServer.filter(img => img.checked)
  if (toDelete.length === 0) return

  try {
    // promise.all sert à à exécuter plusieurs promesses en parallèle et attendre qu’elles 
    // soient toutes terminées avant de continuer
    await Promise.all(
      toDelete.map(img =>
        fetch(`http://${domainName}:3000/images/${img.filename}`, { method: 'DELETE' })
      )
    )
    setPopupMessage(`🗑️ Images supprimées (${toDelete.length})`)
    setShowUploadPopup(true)

    // Mets à jour l'état local
    const remaining = imagesFromServer.filter(img => !img.checked)
    setImagesFromServer(remaining)
  } catch (err) {
    console.error('Erreur de suppression:', err)
    setPopupMessage('❌ Échec de suppression')
    setShowUploadPopup(true)
  }
}


  return (  
    <>
      <Header/>
      <InputTab handleAddImage={addImagesToUpload} imagesToUpload = {imagesToUpload}  handleDeleteImage = {deleteUploadImages}
      handleAllSelectDeselect = {handleAllSelectDeselectUploadImages} sendFormData = {sendFormData} isUploading = {isUploading}
      slideShowFunction = {slideShowFunction}/>
      <ImageListToAdd images={imagesToUpload} toggleImage={toggleUploadImage} setImagesToUpload = { setImagesToUpload }/>
      <h1 className="header-item text-gradient"> Pictures in the server </h1>
      <ServerButtonsTab imagesFromServer = {imagesFromServer} hideImages = {hideFromServer} deleteImages = {delImagesFromServer}
      handleAllSelectDeselect = {handleAllSelectDeselectFromServer} isUploading = {isUploading} getImagesFromServer = {getImagesFromServer}
      downloadImagesFromServer = {downloadImagesFromServer} slideShowFunction = {slideShowFunction}/>
      <ImageListToAdd images={imagesFromServer} toggleImage={toggleFromServer} setImages={setImagesFromServer} />
      <UploadPopup showUploadPopup = {showUploadPopup} setShowUploadPopup = {setShowUploadPopup} popupMessage = {popupMessage}/>
      <SlideShowPopup showSlidePopup = {showSlidePopup} setShowSlidePopup = {setShowSlidePopup} popupSlideImages = {popupSlideImages}/>
    </>
  )
}

export default App
