//
//  ContentView.swift
//  PhotoUploader
//
//  Created by Marc Julio on 27/10/2025.
//

import SwiftUI
import PhotosUI  // 📸 Nécessaire pour le sélecteur natif

private extension NSMutableData {
    func appendString(_ string: String) {
        self.append(Data(string.utf8))
    }
}


struct ContentView: View {
    // Liste des images sélectionnées (en mémoire)
    @State private var selectedItems: [PhotosPickerItem] = []
    // les vraies images chargées
    @State private var selectedImagesToUpload: [UIImage] = []
    // Booléen images ont été sélectionnées pour etre uploadé
    @State private var isSelectedToUpload: Bool = false
    // Message pour le popup de l'Uploading
    @State private var uploadMessage: String? = nil


    var body: some View {
        // Gère la logique de la page d'accueil
        NavigationStack {
            // Début div du sélecteur de photo
            VStack(spacing: 20) {
                // Titre affiché en haut de l'app
                Text("📸 Photo Uploader")
                    .font(.title)
                    .fontWeight(.bold)
                
                // Bouton natif pour sélectionner plusieurs photos sur Iphone (max. 10)
                PhotosPicker(
                    selection: $selectedItems,
                    maxSelectionCount: 10,
                    matching: .images,
                    photoLibrary: .shared()
                ) {
                    // Stylisation du bouton pour sélectionner les photos
                    Label("Select photos", systemImage: "photo.on.rectangle.angled")
                        .font(.headline)
                        .padding()
                        .background(Color.blue.opacity(0.2))
                        .cornerRadius(12)
                }
                .onChange(of: selectedItems) { oldItems, newItems in
                    // déclenché dès qu’on choisit de nouvelles photos quand on sélectionne de nouvelles photos
                    Task {
                        // On supprime les images précédentes si elles ont déjà existé
                        selectedImagesToUpload.removeAll()

                        for item in newItems {
                            // Ici, si on a réussi à charger les données binaires (data), et si on a réussi à en faire une image (uiImage)
                            if let data = try? await item.loadTransferable(type: Data.self),
                               let uiImage = UIImage(data: data) {
                                // Alors on ajoute l'item/photo à nos images selectionnées
                                selectedImagesToUpload.append(uiImage)
                                isSelectedToUpload = true

                            }
                        }
                    }
                }
                // Fin div du sélecteur de photo
                
                // Ligne grise
                Divider()

                // Début affichage des images choisies dans un scroll horizontal
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 12) {
                        // Boucle pour afficher chaque image selectionnée dans le viewer ci-présent
                        ForEach(selectedImagesToUpload, id: \.self) { image in
                            Image(uiImage: image)
                                .resizable()
                                .scaledToFill()
                                .frame(width: 120, height: 120)
                                .clipShape(RoundedRectangle(cornerRadius: 10))
                                .shadow(radius: 3)
                        }
                    }
                    .padding(.horizontal)
                }
                // Fin affichage des images choisies dans un scroll horizontal
                
                // Début affichage pour uploader
                if isSelectedToUpload{
                    HStack(spacing: 20) {
                        Button("Upload") {
                            guard let urlUpload = URL(string: "http://192.168.178.114:3000/upload") else { return }
                            
                            // 1) Construire la requête
                            var request = URLRequest(url: urlUpload)
                            request.httpMethod = "POST"
                            let boundary = "Boundary-\(UUID().uuidString)"
                            request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
                            
                            // 2) Construire le corps multipart
                            let body = NSMutableData()
                            let mimeType = "image/jpeg"
                            
                            for (index, image) in selectedImagesToUpload.enumerated() {
                                // guard est comme un if mais il fait ceci “Je veux que ce soit vrai — sinon, je quitte ici tout de suite.”
                                guard let data = image.jpegData(compressionQuality: 0.9) else { continue }
                                let filename = "image\(index).jpg"
                                
                                body.appendString("--\(boundary)\r\n")
                                // ⚠️ IMPORTANT : le name doit matcher Multer côté serveur
                                body.appendString("Content-Disposition: form-data; name=\"photo\"; filename=\"\(filename)\"\r\n")
                                body.appendString("Content-Type: \(mimeType)\r\n\r\n")
                                body.append(data)
                                body.appendString("\r\n")
                            }
                            
                            // Fin du multipart
                            body.appendString("--\(boundary)--\r\n")
                            
                            // 3) Créer et lancer la tâche
                            let task = URLSession.shared.uploadTask(with: request, from: body as Data) { data, response, error in
                                if let error = error {
                                    print("❌ Upload error:", error.localizedDescription)
                                    DispatchQueue.main.async {
                                        uploadMessage = "❌ Upload error: \(error.localizedDescription)"
                                    }
                                    return
                                }
                                
                                if let http = response as? HTTPURLResponse {
                                    print("📡 Status:", http.statusCode)
                                }
                                
                                if let data = data, let text = String(data: data, encoding: .utf8) {
                                    print("🧾 Server response:", text)
                                    DispatchQueue.main.async {
                                        uploadMessage = "✅ Upload réussi !"
                                    }
                                } else {
                                    DispatchQueue.main.async {
                                        uploadMessage = "⚠️ Réponse inconnue du serveur."
                                    }
                                }
                            }
                            task.resume()
                            
                        }
                        .buttonStyle(.bordered)
                        .controlSize(.large)
                        .buttonBorderShape(.roundedRectangle)
                        
                        // Bouton pour supprimer la sélection
                        Button("Clear") {
                            // On supprime les images précédentes
                            selectedImagesToUpload.removeAll()
                            isSelectedToUpload = false
                        }
                        .buttonStyle(.bordered)
                        .controlSize(.large)
                        .buttonBorderShape(.roundedRectangle)
                    // Parenthèse dessous fin Hstack
                    }
                    Divider()
                }
                
                // "Boutton" de navigation
                NavigationLink(destination: ServerGalleryView()) {
                    Label("Show server's pictures", systemImage: "photo.stack")
                        .font(.headline)
                        .padding()
                        .background(Color.blue.opacity(0.2))
                        .cornerRadius(12)
                }
                .buttonStyle(PlainButtonStyle())
                Divider()
                
                
                // Sert à prendre toute la place si jamais l'app ne prend pas tout l'écran
                Spacer()
            }
            .padding()
            .navigationTitle("Uploader")
            // Début du PopUp ".alert" est le module qui affiche les pop up dans les app iphones
            .alert(uploadMessage ?? "", isPresented: Binding(
                // ici "get" sert à traduire le message d' "uploadMessage" en booléen -> si le Message est nil = false, si c'est un texte = true
                get: { uploadMessage != nil },
                // ici "set" permet à SwiftUI de fermer l’alerte. permet à SwiftUI de fermer l’alerte et Quand l’utilisateur clique sur “OK”, SwiftUI envoie false dans ce set:
                set: { if !$0 { uploadMessage = nil } }
            )) {
                // Ici le bouton avec le texte "OK" a pour role cancel -> ferme le pop up et réinitialise l' "uploadMessage"
                Button("OK", role: .cancel) {
                    uploadMessage = nil
                    isSelectedToUpload = false
                    selectedImagesToUpload.removeAll()}
            }
            // Fin du PopUp
        }
    }
}

#Preview {
    ContentView()
}
