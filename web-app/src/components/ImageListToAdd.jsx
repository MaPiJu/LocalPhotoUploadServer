import { ImageCard } from "./ImageCard"

export function ImageListToAdd(props){
    const { images } = props

    
    return (
        <div className="list-item">
        {/* On loop sur les images uploadé */}
        { images?.map((image, imageIndex)=>{
            return (
                // Pour chaque tache on crée ici une ImageCard
                <ImageCard 
                    // On lui donne ici un index unique key qui provient de la liste filtrée
                    key={imageIndex} 

                    // On lui donne toutes les props originales à ImageCard (Image, handleDeleteImage, ImageIndex, handleCompleteImage)
                    {...props}

                    // On passe ici la tâche actuelle (image) à ImageCard, cela permet à la "ImageCard" d'afficher les infos de
                    // cette tâche
                    image={image}/>
            )
        })}
        </div>
    )
}