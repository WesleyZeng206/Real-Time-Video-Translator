from openai import OpenAI


class TranscriptionService:

    def __init__(self, api_key: str):
        self.client = OpenAI(api_key=api_key)

    def transcribe(self, audio_path: str):
        try:
            with open(audio_path, 'rb') as f:
                resp = self.client.audio.transcriptions.create(
                    model="whisper-1",
                    file=f,
                    response_format="verbose_json",
                    timestamp_granularities=["segment"]
                )

            segs = []
            if hasattr(resp, 'segments') and resp.segments:
                for s in resp.segments:
                    segs.append({
                        'start': s['start'],
                        'end': s['end'],
                        'text': s['text'].strip()
                    })
            else:
                segs.append({
                    'start': 0,
                    'end': 0,
                    'text': resp.text
                })

            return {
                'text': resp.text,
                'segments': segs
            }

        except Exception as e:
            raise Exception(f"Error transcribing audio: {str(e)}")
