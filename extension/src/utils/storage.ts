import { Settings } from '../types';

export const storage = {
  async getSettings(): Promise<Settings> {
    return new Promise((resolve) => {
      chrome.storage.local.get(['apiKey', 'backendUrl', 'selectedLanguages'], (result) => {
        resolve({
          apiKey: result.apiKey || '',
          backendUrl: result.backendUrl || 'http://localhost:5000',
          selectedLanguages: result.selectedLanguages || ['es']
        });
      });
    });
  },

  async saveSettings(settings: Partial<Settings>): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set(settings, () => {
        resolve();
      });
    });
  },

  async clear(): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.clear(() => {
        resolve();
      });
    });
  }
};
