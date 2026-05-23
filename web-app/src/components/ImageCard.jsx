export function ImageCard(props){

    const { toggleImage, image } = props

    return(
    <div className="card-item"> 
          <input className="checkbox-item" type="checkbox" checked={image.checked} onChange={() => toggleImage(image.id)}/>
          <img className='img' src={image.input ? URL.createObjectURL(image.input) : image.url} alt={image.filename || 'Image'} />
    </div>
    )
}


