export interface Language {
  code: string;
  name: string;
}

export interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
}

export interface TranslationResponse {
  success: boolean;
  original: TranscriptionSegment[];
  translations: {
    [languageCode: string]: TranscriptionSegment[];
  };
  video_url: string;
  target_languages: string[];
  cached?: boolean;
}

export interface Settings {
  apiKey: string;
  backendUrl: string;
  selectedLanguages: string[];
}

export interface ProcessingOptions {
  videoUrl: string;
  targetLanguages: string[];
  startTime?: number;
  endTime?: number;
}

export interface Message {
  type: 'TRANSLATE_VIDEO' | 'VIDEO_PROCESSED' | 'UPDATE_TIME' | 'ERROR' | 'GET_SETTINGS' | 'GET_VIDEO_URL';
  data?: any;
}
