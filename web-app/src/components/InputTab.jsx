export function InputTab(props) {
    const { handleAddImage, imagesToUpload ,handleDeleteImage, 
        handleAllSelectDeselect, sendFormData, isUploading, slideShowFunction} = props


    
    return (
        <div className="input-container">
            <input className="input-item" type='file'   accept="image/png, image/jpeg" multiple 
            onChange={(e) => { 
                handleAddImage(Array.from(e.target.files))
                }}  />
            
            {/* Lorsque l'on clique sur le boutton ci-dessous, les images sélectionnées sont envoyées */}
            <button className="input-item" onClick={()=>sendFormData(imagesToUpload)} 
            disabled={imagesToUpload.length === 0 || isUploading ? true : false}>
                Upload
            </button>

            {/* Lorsque l'on clique sur le boutton ci-dessous, les images sélectionnées sont supprimées */}
            <button className="input-item" onClick={()=>handleDeleteImage()} 
            disabled={imagesToUpload.length === 0 || isUploading ? true : false}>
                Delete
            </button>


            {/* Lorsque l'on clique sur le boutton ci-dessous, les images sélectionnées sont supprimées */}
            <button className="input-item" onClick={()=>handleAllSelectDeselect()} 
            disabled={imagesToUpload.length === 0 || isUploading ? true : false}>
                Select/Deselect All
            </button>

            {/* Lorsque l'on clique sur le boutton ci-dessous, les images sélectionnées apparaissent en Popup */}
            <button className="input-item" onClick={()=>slideShowFunction(imagesToUpload)} 
            disabled={imagesToUpload.length === 0 || isUploading ? true : false}>
                Slide Show
            </button>

        </div>
    )
}