//
//  ServerGalleryView.swift
//  PhotoUploader
//
//  Created by Marc Julio on 27/10/2025.
//

import SwiftUI
import Foundation
import UIKit
import Photos

// URL où se trouve le service de toutes les images à servir
let baseURL = "http://192.168.178.114:3000"

// Le modèle pour un seul élément d'image
struct ImageItem: Decodable {
    let filename: String
    let url: String
}

// Le modèle pour la réponse complète de l'API
struct ImageResponse: Decodable {
    let ok: Bool
    let total: Int
    let items: [ImageItem]
}

// Modèle combiné pour UIImage + ImageItem
struct DisplayImage: Hashable {
    let image: UIImage
    let item: ImageItem

    func hash(into hasher: inout Hasher) {
        hasher.combine(item.filename) // Utilise uniquement des types hashables sûrs
    }

    static func == (lhs: DisplayImage, rhs: DisplayImage) -> Bool {
        return lhs.item.filename == rhs.item.filename
    }
}


// Errors
enum FetchError: Error {
    case invalidURL
    case invalidResponse
    case imageDataNotFound
}

// Image loader
class ImageLoader {
    
    // Fonction asynchrone pour récupérer les URL des images
    func fetchImageURLs() async throws -> [ImageItem] {
        guard let url = URL(string: "\(baseURL)/images") else {
            throw FetchError.invalidURL
        }
        
        // Requête HTTP asynchrone
        let (data, response) = try await URLSession.shared.data(from: url)
        
        // Vérifie que response est bien une réponse HTTP et que le code HTTP est 200 (succès).
        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            throw FetchError.invalidResponse
        }
        
        // Utilise JSONDecoder pour convertir les données JSON en un objet ImageResponse
        let decodedResponse = try JSONDecoder().decode(ImageResponse.self, from: data)
        
        // Retourne le tableau des objets ImageItem extrait de la réponse JSON
        return decodedResponse.items
    }
    
// Fonction pour télécharger une image individuelle
    func downloadImage(from item: ImageItem) async throws -> DisplayImage {
        // On fabrique l'URL pour l'image
        guard let url = URL(string: baseURL + item.url) else {
            throw FetchError.invalidURL
        }
        
        // Requête HTTP asynchrone pour l'image
        let (data, _) = try await URLSession.shared.data(from: url)
        
        // On convertit des données binaires (data) en image (UIImage)
        guard let image = UIImage(data: data) else {
            throw FetchError.imageDataNotFound
        }
        
        return DisplayImage(image: image, item: item)
    }
    
    // Fonction qui orchestre le téléchargement de toutes les images
    func fetchAllImages() async throws -> [DisplayImage] {
        let imageItems = try await fetchImageURLs()
        
        return try await withThrowingTaskGroup(of: DisplayImage.self) { group in
            for item in imageItems {
                group.addTask {
                    // On convertit en UIImage pour chaque item de la liste d'images que l'on a demandé en requête
                    return try await self.downloadImage(from: item)
                }
            }
            
            // Création de la liste "images" que l'on va retourner et qui va être compatible avec IOS
            var images: [DisplayImage] = []
            // On loop sur la liste "group", où l'on télécharger chaque image via son URL et transformé en
            // En UI compaible
            for try await image in group {
                images.append(image)
            }
            
            return images
        }
    }
}


// DÉBUT DE L'UI

struct ServerGalleryView: View {
    @State private var serverImages: [DisplayImage] = []
    @State private var selectedImages: Set<DisplayImage> = []
    @State private var isLoading = false
    @State private var fetchError: String? = nil
    // Use State pour rafraîchir la page
    @State private var refreshID = UUID()

    let columns = [
        GridItem(.flexible()),
        GridItem(.flexible())
    ]

    var body: some View {
        VStack(spacing: 8) {
            Text("📸 Server's pictures")
                .font(.title2)

            if isLoading {
                ProgressView("Chargement...")
            } else if let fetchError = fetchError {
                Text("❌ Erreur: \(fetchError)")
                    .foregroundColor(.red)
            } else {
                ScrollView {
                    LazyVGrid(columns: columns, spacing: 16) {
                        ForEach(serverImages, id: \.self) { displayImage in
                            ZStack {
                                Image(uiImage: displayImage.image)
                                    .resizable()
                                    .scaledToFill()
                                    .frame(width: 160, height: 160)
                                    .clipped()
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 8)
                                            .stroke(selectedImages.contains(displayImage) ? Color.blue : Color.clear, lineWidth: 4)
                                    )
                                    .opacity(selectedImages.contains(displayImage) ? 0.6 : 1.0)
                                    .cornerRadius(8)
                                    .shadow(radius: 2)
                            }
                            .onTapGesture {
                                toggleSelection(for: displayImage)
                            }
                        }
                    }
                    .id(refreshID) // <-- Force SwiftUI à reconstruire la grille
                    .padding(.horizontal)
                }
            }
            if (selectedImages.count > 0){
                
                // Bouton "Download"
                Button("Download Selection") {
                    // On télécharge seulement les photos sélectionnées
                    PHPhotoLibrary.requestAuthorization(for: .addOnly) { status in
                        if status == .authorized {
                            PHPhotoLibrary.shared().performChanges {
                                for image in selectedImages {
                                    PHAssetChangeRequest.creationRequestForAsset(from: image.image)
                                }
                            } completionHandler: { success, error in
                                if success {
                                    DispatchQueue.main.async {
                                        selectedImages.removeAll()
                                        refreshID = UUID() // <- Vue rechargée
                                    }
                                }
                            }
                        }
                    }
                }
                .buttonStyle(.bordered)
                .controlSize(.large)
                .buttonBorderShape(.roundedRectangle)
                
                // Boutton "Delete"
                Button("Delete Selection") {
                    // Création de la liste d'url à supprimer
                    var urlsToDelete: [URL] = []
                    for imageSelected in selectedImages {
                        if let url = URL(string: "\(baseURL)/images/\(imageSelected.item.filename)"){
                            urlsToDelete.append(url)
                        }
                    }
                    // Multitâche pour supprimer
                    Task {
                        await withTaskGroup(of: Void.self) { group in
                            for url in urlsToDelete {
                                group.addTask {
                                    // send DELETE request to this url
                                    
                                    // 1) Construire la requête
                                    var request = URLRequest(url: url)
                                    request.httpMethod = "DELETE"
                                    
                                    // 2) Execution de la requête
                                    do {
                                        let (data, response) = try await URLSession.shared.data(for: request)
                                            if let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 {
                                                print("✅ Supprimée :", url.lastPathComponent)
                                            } else {
                                                print("⚠️ Erreur de suppression :", url.lastPathComponent)
                                            }
                                    } catch {
                                        print("❌ Erreur réseau pour :", url.lastPathComponent)
                                    }
                                }
                            }
                        }
                        DispatchQueue.main.async {
                            serverImages.removeAll(where: { selectedImages.contains($0) })
                            selectedImages.removeAll()
                            refreshID = UUID() // <- Vue rechargée
                        }
                    }
                }
                .buttonStyle(.bordered)
                .controlSize(.large)
                .buttonBorderShape(.roundedRectangle)
                .foregroundColor(.red)
            }
        }
        .padding()
        .onAppear {
            retrieveServerPhotos()
        }
    }

    func toggleSelection(for image: DisplayImage) {
        if selectedImages.contains(image) {
            selectedImages.remove(image)
        } else {
            selectedImages.insert(image)
        }
    }

    func retrieveServerPhotos() {
        isLoading = true
        fetchError = nil

        let imageLoader = ImageLoader()
        Task {
            do {
                serverImages = try await imageLoader.fetchAllImages()
            } catch {
                fetchError = error.localizedDescription
            }
            isLoading = false
        }
    }
}

