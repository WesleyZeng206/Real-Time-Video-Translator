import os
from dask import delayed, compute
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

    def _translate_batch(self, batch, lang_name: str):
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

        translated = resp.choices[0].message.content or ''
        lines = translated.strip().split('\n') if translated else []

        batch_result = []
        for idx, seg in enumerate(batch):
            tr = ''
            for line in lines:
                if line.strip().startswith(f"{idx}."):
                    tr = line.split('.', 1)[1].strip()
                    break

            if not tr and idx < len(lines):
                tr = lines[idx].strip()

            batch_result.append({
                'start': seg['start'],
                'end': seg['end'],
                'text': tr or seg['text']
            })

        return batch_result

    def translate(self, segments, lang):
        try:
            lang_name = self.LANGUAGES.get(lang, lang)
            result = []

            batch_size = 10
            batches = [segments[i:i + batch_size] for i in range(0, len(segments), batch_size)]

            max_workers_env = os.getenv('TRANSLATION_BATCH_WORKERS', '').strip()

            try:
                max_workers = int(max_workers_env) if max_workers_env else 4
            except ValueError:
                max_workers = 4

            if len(batches) <= 1 or max_workers <= 1:
                for batch in batches:
                    result.extend(self._translate_batch(batch, lang_name))
                return result

            workers = min(len(batches), max_workers)
            tasks = [delayed(self._translate_batch)(batch, lang_name) for batch in batches]
            batch_results = compute(*tasks, scheduler="threads", num_workers=workers)

            for res in batch_results:
                result.extend(res)

            return result

        except Exception as e:
            raise Exception(f"Error translating text: {str(e)}")
