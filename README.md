# LocalTube 📺

A privacy-focused, offline-first YouTube video manager, downloader, and interactive local player built with React, Vite, Tailwind CSS, Express, and `yt-dlp`.

---

## 🚀 Features

- **Offline Video Library**: Manage and watch downloaded YouTube videos without an active internet connection.
- **yt-dlp Downloader Integration**: Download videos with metadata, thumbnails, chapters, and top comments via `yt-dlp`.
- **Custom Interactive Player**: Feature-rich local player supporting timeline markers, custom notes, and chapter navigation.
- **Timestamped Notes & Comments**: Add personal notes pinned to specific timestamps for study, research, or content creation.
- **Collections & Playlists**: Organize your local video library into custom playlists and collections.
- **Local Search & History**: Fast full-text search across titles, descriptions, and comments, along with watch history tracking.
- **Modern UI**: YouTube-inspired dark-themed interface built with Tailwind CSS and Lucide icons.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons
- **Backend Server**: Node.js, Express.js (Media static server & downloader process orchestrator)
- **Downloader Engine**: `yt-dlp` CLI (Python)
- **Data Persistence**: Browser Local Storage / IndexedDB for local library state; local file system for media storage

---

## 📋 Prerequisites

Ensure you have the following installed on your system before running LocalTube:

1. **Node.js** (v18.0.0 or higher) & `npm`
2. **Python** (v3.8 or higher)
3. **yt-dlp CLI**:
   - **macOS**: `brew install yt-dlp`
   - **Linux**: `sudo apt update && sudo apt install yt-dlp`
   - **pip**: `pip install yt-dlp`
4. **ffmpeg** (Recommended for video and audio processing by `yt-dlp`):
   - **macOS**: `brew install ffmpeg`
   - **Linux**: `sudo apt install ffmpeg`

---

## 💻 Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/LocalTube.git
   cd LocalTube
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

---

## 🚦 Running the Application

### Concurrent Mode (Recommended)
Start both the Express backend API and the Vite frontend dev server simultaneously:

```bash
npm start
```

- **Frontend App**: `http://localhost:5173`
- **Backend API**: `http://localhost:3001`

### Running Services Separately

- **Start Backend API Server**:
  ```bash
  npm run server
  ```

- **Start Frontend Dev Server**:
  ```bash
  npm run dev
  ```

---

## 📁 Project Structure

```
LocalTube/
├── index.html            # Main HTML template
├── package.json          # Node.js dependencies and script definitions
├── postcss.config.js     # PostCSS configuration
├── tailwind.config.js    # Tailwind CSS styling configuration
├── vite.config.js        # Vite bundler configuration
├── server/
│   ├── index.js          # Express API server for video downloads & static media serving
│   └── downloader.py     # Python CLI script for yt-dlp video ingestion
└── src/
    ├── App.jsx           # Main Application UI component
    ├── main.jsx          # React app entry point
    ├── index.css         # Global CSS stylesheet & Tailwind directives
    ├── components/       # React UI components (Player, Modals, Navbar, etc.)
    └── services/         # Client database and downloader service modules
```

---

## 🛡️ Privacy & Security

- **Local Storage Only**: All video media, watch logs, notes, and playlists stay entirely on your local machine.
- **Zero Telemetry**: No tracking, metrics, or third-party analytics are embedded.
- **No Credentials Required**: Operates without requiring user logins or API keys.

---

## 📜 License

This project is licensed under the MIT License.
