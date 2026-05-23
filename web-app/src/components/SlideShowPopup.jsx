import Popup from 'reactjs-popup'
import { useState } from 'react'
import 'reactjs-popup/dist/index.css'

export function SlideShowPopup(props) {
    const { showSlidePopup, setShowSlidePopup, popupSlideImages } = props
    
    const [slideIndex, setSlideIndex] = useState(0)

    const image = popupSlideImages[slideIndex]

    return (
        // "modal" -> sert à overlay plein écran
        // "nested" -> permet d’avoir plusieurs popups ouverts en même temps (imbriqués)
    <Popup className="image-popup" open={showSlidePopup} onClose={() => setShowSlidePopup(false)} modal nested>
        <img className='img-popup' src={image?.input ? URL?.createObjectURL(image?.input) : image?.url} alt={image?.filename || 'Image'} />
        <div> 
            <button onClick={() => setSlideIndex(prev => Math.max(prev - 1, 0))}>
            Previous
        </button>
        <button onClick={() => { setShowSlidePopup(false) ; setSlideIndex(0)}}>
            Close
        </button>

        <button onClick={() => setSlideIndex(prev => Math.min(prev + 1, popupSlideImages.length - 1))}>
            Next
        </button>
        </div>
        
    </Popup>
    )
}