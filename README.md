# AI Video Translator

Chrome extension that translates YouTube videos using OpenAI Whisper and GPT.

## Setup

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
```

You'll need FFmpeg installed. Instructions can be found online.

Create a `.env` file in the backend folder with your OpenAI key:
```
OPENAI_API_KEY=[your_key_here]
```

### Extension

```bash
cd extension
npm install
npm run build
```

Then load it in Chrome:
1. Go to `chrome://extensions/`
2. Turn on developer mode
3. Click "Load unpacked" and select the `extension/dist` folder

## Running it

Start the backend:
```bash
cd backend
python app.py
```

Then just go to any YouTube video, click the extension, and hit translate.

## API

- `GET /health` - check if server is running
- `POST /api/process-video` - send `video_url` and `target_language`
- `GET /api/languages` - get supported languages
