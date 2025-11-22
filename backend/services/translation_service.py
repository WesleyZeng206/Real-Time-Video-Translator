from openai import OpenAI


class TranslationService:

    LANGUAGES = {
        'es': 'Spanish',
        'fr': 'French',
        'de': 'German',
        'zh': 'Chinese (Simplified)',
        'ja': 'Japanese',
        'en': 'English'
    }

    def __init__(self, api_key: str):
        self.client = OpenAI(api_key=api_key)

    def translate(self, segments, target_lang: str):
        try:
            lang_name = self.LANGUAGES.get(target_lang, target_lang)
            result = []

            batch_size = 10
            for i in range(0, len(segments), batch_size):
                batch = segments[i:i + batch_size]

                texts = [s['text'] for s in batch]
                combined = '\n'.join(f"{idx}. {t}" for idx, t in enumerate(texts))

                resp = self.client.chat.completions.create(
                    model="gpt-4",
                    messages=[
                        {
                            "role": "system",
                            "content": f"You are a professional translator. Translate the following numbered lines to {lang_name}. Maintain the same numbering and format. Only output the translated text with numbers, nothing else."
                        },
                        {
                            "role": "user",
                            "content": combined
                        }
                    ],
                    temperature=0.3
                )

                translated = resp.choices[0].message.content
                lines = translated.strip().split('\n')

                for idx, seg in enumerate(batch):
                    tr = ''
                    for line in lines:
                        if line.strip().startswith(f"{idx}."):
                            tr = line.split('.', 1)[1].strip()
                            break

                    if not tr:
                        if idx < len(lines):
                            tr = lines[idx].strip()

                    result.append({
                        'start': seg['start'],
                        'end': seg['end'],
                        'text': tr or seg['text']
                    })

            return result

        except Exception as e:
            raise Exception(f"Error translating text: {str(e)}")
