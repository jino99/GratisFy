
# Gratisfy

![GitHub stars](https://img.shields.io/github/stars/jino99/gratisfy?style=for-the-badge)
![GitHub forks](https://img.shields.io/github/forks/jino99/gratisfy?style=for-the-badge)
![GitHub issues](https://img.shields.io/github/issues/jino99/gratisfy?style=for-the-badge)
![GitHub license](https://img.shields.io/github/license/jino99/gratisfy?style=for-the-badge)

A sleek, **cyber-noir inspired YouTube Music player** built with **React, Vite, and Tailwind CSS**.

---

## 🚀 Features
- 🎵 **YouTube Music Integration** – Stream and play music directly from YouTube
- 🔍 **Advanced Search** – Instant search with debouncing + rich results
- 📚 **Library Management** – Save & organize your favorite tracks
- ⏯️ **Queue System** – Create and manage custom playlists
- 🎨 **Cyber‑Noir UI** – Dark mode with purple aesthetics and smooth animations
- 📱 **Responsive** – Works beautifully on mobile & desktop
- 🎛️ **Advanced Controls** – Repeat, shuffle, volume, seeking
- ⚡ **Performance Optimized** – Fast loading & smooth playback

---

## 🧰 Tech Stack
### **Frontend**
- React 18
- Vite
- Tailwind CSS
- Framer Motion

### **Backend**
- Node.js middleware
- yt-search
- yt-dlp

### **Other**
- State management: Zustand (with persistence)
- Audio: HTML5 Audio API + range requests
- Icons: Lucide React

---

## 🛠️ Getting Started

### **Prerequisites**
- Node.js **v16+**
- npm or yarn

### **Installation**
```bash
git clone https://github.com/jino99/gratisfy
cd gratisfy
npm install
```

### **Run Development Server**
```bash
npm run dev
```
Open: **http://localhost:5173**

---

## 🎮 Usage
- **Search Music** – Use the search bar to find YouTube Music tracks
- **Play Tracks** – Click any result to start playback
- **Save to Library** – Build your personal music collection
- **Queue Tracks** – Create on-the-fly playlists
- **Use Advanced Controls** – Shuffle, repeat, seek, adjust volume

---

## 📁 Project Structure
```
gratisfy/
├── src/
│   ├── App.jsx          # Main application component
│   ├── main.jsx         # Entry point
│   └── assets/          # Static assets
├── public/              # Public files
├── bin/                 # yt-dlp binary
├── vite.config.js       # Vite config + middleware
├── package.json         # Dependencies & scripts
└── README.md            # This file
```

---

## 🔧 Configuration
The app uses **yt-dlp** (bundled in `/bin/`) to stream high‑quality audio from YouTube.

---

## 📡 API Endpoints
```
GET /api/ytm/search?q=<query>     # Search YouTube Music
GET /api/ytm/stream?videoId=<id>  # Stream audio
```

---

## 🤝 Contributing
1. Fork the repo
2. Create a feature branch
3. Commit your changes
4. Open a pull request

---

## 📜 License
Licensed under the **MIT License**. See `LICENSE.md`.

---

## 🙏 Acknowledgments
- YouTube Music
- yt-dlp
- yt-search
- Vite
- Tailwind CSS
- Framer Motion

