import yt_dlp
import os
import tempfile


class YouTubeService:

    def __init__(self):
        self.tmp = tempfile.gettempdir()

    def download_audio(self, url: str, start=None, end=None) -> str:
        import time
        out = os.path.join(self.tmp, f'%(id)s_{int(time.time())}.%(ext)s')

        opts = {
            'format': 'bestaudio/best',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
            'outtmpl': out,
            'quiet': True,
            'no_warnings': True,
        }

        if start is not None or end is not None:
            args = []
            if start is not None:
                args.extend(['-ss', str(start)])
            if end is not None:
                dur = end - (start or 0)
                args.extend(['-t', str(dur)])

            if args:
                opts['postprocessor_args'] = args

        try:
            with yt_dlp.YoutubeDL(opts) as ydl:
                info = ydl.extract_info(url, download=True)
                vid = info.get('id', 'unknown')

                import glob
                pattern = os.path.join(self.tmp, f"{vid}_*.mp3")
                files = glob.glob(pattern)

                if files:
                    f = files[0]
                else:
                    f = os.path.join(self.tmp, f"{vid}.mp3")

                if not os.path.exists(f):
                    raise Exception(f"Audio file not found: {f}")

                return f

        except Exception as e:
            raise Exception(f"Error downloading audio: {str(e)}")

    def cleanup(self, path: str):
        try:
            if os.path.exists(path):
                os.remove(path)
        except Exception as e:
            print(f"Error cleaning up file {path}: {str(e)}")
