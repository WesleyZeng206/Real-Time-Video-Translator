# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Backend Setup (2 minutes)

```bash
# Navigate to backend
cd backend

# Install Python dependencies
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your OpenAI API key

# Start the server
python app.py
```

### Step 2: Extension Setup (2 minutes)

```bash
# Navigate to extension (in a new terminal)
cd extension

# Install dependencies and build
npm install
npm run build
```

### Step 3: Load in Chrome (1 minute)

1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode" (top-right toggle)
3. Click "Load unpacked"
4. Select the `extension/dist` folder
5. Click the extension icon and enter your OpenAI API key

### Step 4: Use It!

1. Go to any YouTube video
2. Click the extension icon to open side panel
3. Click "Translate Video"
4. Wait for processing
5. Watch with synchronized translations!

## Requirements

- **Python 3.8+**
- **Node.js 16+**
- **OpenAI API Key** ([Get one here](https://platform.openai.com/api-keys))
- **FFmpeg** installed on your system

## Install FFmpeg

**Mac:**
```bash
brew install ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt-get install ffmpeg
```

**Windows:**
Download from [ffmpeg.org](https://ffmpeg.org/download.html)

## Troubleshooting

**Backend won't start:**
- Make sure FFmpeg is installed: `ffmpeg -version`
- Check your OpenAI API key in `.env`

**Extension won't load:**
- Run `npm run build` in the extension folder
- Make sure you selected the `dist` folder, not the `extension` folder

**Translation fails:**
- Verify backend is running on `http://localhost:5000`
- Check backend URL in extension settings
- Ensure you have OpenAI API credits

## Need Help?

See the full [README.md](README.md) for detailed documentation.
