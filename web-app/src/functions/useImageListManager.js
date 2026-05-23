import { useState } from 'react';

// Fallback UUID generator si crypto.randomUUID() est indisponible
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default function useImageListManager(initialImages = []) {
  const [images, setImages] = useState(initialImages || [])

  const addImages = (newImages) => {
    const toAdd = newImages.map(f => ({
      input: f,
      checked: true,
      id: (typeof crypto?.randomUUID === 'function' ? crypto.randomUUID() : generateUUID()),
    }));
    setImages(prev => [...prev, ...toAdd])
    console.log("Ho")
    console.log(images)
  }

  const deleteChecked = () => {
    let newImages = images.filter((img) => img.checked === false)
    setImages(newImages)
  }

  const handleAllSelectDeselect = () => {
    let filteredImage = images.filter((img) => img.checked === false)
    let allSame = filteredImage.length === 0 || filteredImage.length === images.length

    let newImages = images.map(img => allSame ? { ...img, checked: !img.checked } : { ...img, checked: true })
    setImages(newImages)
  }

  const toggleImage = (id) => {
    setImages(prevImages =>
      prevImages.map(img => img.id === id ? { ...img, checked: !img.checked } : img)
    )
  }

  return {
    images,
    addImages,
    setImages,
    deleteChecked,
    handleAllSelectDeselect,
    toggleImage,
  }
}
