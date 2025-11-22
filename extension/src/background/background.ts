import { Message, TranslationResponse } from '../types';
import { storage } from '../utils/storage';

chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  if (message.type === 'TRANSLATE_VIDEO') {
    handleTranslateVideo(message.data)
      .then(sendResponse)
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }

  if (message.type === 'GET_SETTINGS') {
    storage.getSettings()
      .then(sendResponse)
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }
});

async function handleTranslateVideo(data: {
  videoUrl: string;
  targetLanguages: string[];
  startTime?: number;
  endTime?: number;
}) {
  try {
    const settings = await storage.getSettings();

    if (!settings.apiKey) {
      throw new Error('OpenAI API key not configured. Please set it in the extension popup.');
    }

    const requestBody: any = {
      video_url: data.videoUrl,
      target_languages: data.targetLanguages,
      api_key: settings.apiKey
    };

    if (data.startTime !== undefined) {
      requestBody.start_time = data.startTime;
    }
    if (data.endTime !== undefined) {
      requestBody.end_time = data.endTime;
    }

    const response = await fetch(`${settings.backendUrl}/api/process-video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to process video');
    }

    const result: TranslationResponse = await response.json();
    return result;

  } catch (error) {
    console.error('Error in background script:', error);
    throw error;
  }
}

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));
