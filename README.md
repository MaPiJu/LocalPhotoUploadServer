# Photo Uploader

A complete system for uploading, viewing, downloading, and deleting photos from an iPhone or a web browser via a local server (Raspberry Pi).

## Architecture

```
server/     → Node.js/Express server (running on a Raspberry Pi)
web-app/    → React/Vite application (browser)
ios-app/    → SwiftUI iOS App (iPhone)
```

---

## server/ — Node.js server

Runs on the Raspberry Pi and exposes a REST API for managing photos.

### Routes

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/upload` | Upload one or more photos (multipart/form-data, `photo` field) |
| `GET` | `/images` | List all stored photos (JSON) |
| `GET` | `/download?file=filename.jpg` | Downloads a single photo |
| `POST` | `/downloads` | Downloads multiple photos as a ZIP file (`{ files: [“a.jpg”, “b.jpg”] }`) |
| `DELETE` | `/images/:filename` | Deletes a photo from the server |
| `GET` | `/photos/:filename` | Serves static files (direct URL for viewing) |

### Start the server

```bash
cd server
npm install
npm start
# Server available at http://<RASPBERRY_IP>:3000
```

### Configuration

The Raspberry Pi's IP address must be updated in all three parts of the project. It is currently set to `192.168.178.114`.

---

## web-app/ — React/Vite Application

Web interface for uploading photos from a computer and managing photos stored on the server.

### Features

- Select and preview photos before uploading
- Upload to the server (selected photos)
- View the server gallery
- Download individual photos or as a ZIP file
- Delete from the server
- Slideshow of selected photos

### Launch the web app

```bash
cd web-app
npm install
npm run dev
# Available at http://localhost:5173
```

---

## ios-app/ — iOS SwiftUI app

iPhone app for uploading and managing photos directly from the photo library.

### Features

- Select up to 10 photos from the photo library
- Horizontal scroll preview
- Upload to the server using multipart/form-data
- Server gallery in grid view
- Download to the camera roll
- Delete from the server

### Launch the iOS app

Open `ios-app/PhotoUploader.xcodeproj` in Xcode, select a simulator or an iPhone, then launch.

---

## Network Configuration

The server's IP address is hardcoded in the following files—change these if the Raspberry Pi's address changes:

- `web-app/src/App.jsx` — line `const rasp = “192.168.178.114”`
- `ios-app/PhotoUploader/ContentView.swift` — line `URL(string: “http://192.168.178.114:3000/upload”)`
- `ios-app/PhotoUploader/ServerGalleryView.swift` — line `let baseURL = “http://192.168.178.114:3000”`
- `server/server.js` — `allowedOrigins` list for CORS
