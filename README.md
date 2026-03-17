# Gratisfy

A sleek, cyber-noir inspired YouTube Music player built with React, Vite, and Tailwind CSS.

## Features

- **🎵 YouTube Music Integration**: Stream and play music directly from YouTube
- **🔍 Advanced Search**: Instant search with debouncing and comprehensive results
- **📚 Library Management**: Save and organize your favorite tracks
- **⏯️ Queue System**: Create and manage custom playlists
- **🎨 Cyber-Noir UI**: Dark theme with purple accents and smooth animations
- **📱 Responsive Design**: Works seamlessly on desktop and mobile
- **🎛️ Advanced Controls**: Repeat, shuffle, volume, and seeking
- **⚡ Performance Optimized**: Fast loading and smooth playback

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion
- **Backend**: Node.js middleware with yt-search and yt-dlp
- **State Management**: Zustand with persistence
- **Audio**: HTML5 Audio API with Range requests support
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/jino99/gratisfy
cd gratisfy
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Usage

1. **Search Music**: Use the search bar to find tracks from YouTube Music
2. **Play Tracks**: Click on any track to start playing
3. **Manage Library**: Save your favorite tracks to your personal library
4. **Create Queue**: Add tracks to queue for custom playlists
5. **Advanced Controls**: Use repeat, shuffle, and seek controls

## Project Structure

```
gratisfy/
├── src/
│   ├── App.jsx          # Main application component
│   ├── main.jsx         # Application entry point
│   └── assets/          # Static assets
├── public/              # Public assets (favicon, etc.)
├── bin/                 # yt-dlp binary
├── vite.config.js       # Vite configuration with custom middleware
├── package.json         # Dependencies and scripts
└── README.md            # This file
```

## Configuration

The application uses yt-dlp for streaming audio from YouTube. The binary is included in the `bin/` directory for cross-platform compatibility.

## API Endpoints

- `GET /api/ytm/search?q=<query>` - Search YouTube Music
- `GET /api/ytm/stream?videoId=<id>` - Stream audio

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Acknowledgments

- YouTube Music for the music content
- yt-dlp for YouTube audio extraction
- yt-search for YouTube search functionality
- Vite for the build tool
- Tailwind CSS for styling
- Framer Motion for animations
