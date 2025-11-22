from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
from services.transcription_service import TranscriptionService
from services.translation_service import TranslationService
from services.youtube_service import YouTubeService

load_dotenv()

app = Flask(__name__)
CORS(app)

youtube_service = YouTubeService()
transcription_service = TranscriptionService(api_key=os.getenv('OPENAI_API_KEY'))
translation_service = TranslationService(api_key=os.getenv('OPENAI_API_KEY'))


@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'}), 200


@app.route('/api/process-video', methods=['POST'])
def process_video():
    try:
        data = request.get_json()
        video_url = data.get('video_url')
        target_languages = data.get('target_languages', ['es'])
        start_time = data.get('start_time')
        end_time = data.get('end_time')

        if not video_url:
            return jsonify({'error': 'video_url is required'}), 400

        if not isinstance(target_languages, list):
            target_languages = [target_languages]

        print(f"Extracting audio from: {video_url}")
        audio_file = youtube_service.download_audio(video_url, start_time, end_time)

        print(f"Transcribing audio...")
        transcription = transcription_service.transcribe(audio_file)

        translations = {}
        for lang in target_languages:
            print(f"Translating to {lang}...")
            translation = translation_service.translate(
                transcription['segments'],
                lang
            )
            translations[lang] = translation

        youtube_service.cleanup(audio_file)

        return jsonify({
            'success': True,
            'original': transcription['segments'],
            'translations': translations,
            'video_url': video_url,
            'target_languages': target_languages
        }), 200

    except Exception as e:
        print(f"Error processing video: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/languages', methods=['GET'])
def get_languages():
    languages = [
        {'code': 'es', 'name': 'Spanish'},
        {'code': 'fr', 'name': 'French'},
        {'code': 'de', 'name': 'German'},
        {'code': 'zh', 'name': 'Chinese (Simplified)'},
        {'code': 'ja', 'name': 'Japanese'},
        {'code': 'en', 'name': 'English'}
    ]
    return jsonify(languages), 200


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
