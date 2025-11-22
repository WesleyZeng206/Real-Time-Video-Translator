import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { storage } from '../utils/storage';
import { cacheManager } from '../utils/cache';
import { Language, Settings } from '../types';
import './popup.css';

const LANGUAGES: Language[] = [
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'zh', name: 'Chinese (Simplified)' },
  { code: 'ja', name: 'Japanese' },
  { code: 'en', name: 'English' }
];

const Popup: React.FC = () => {
  const [settings, setSettings] = useState<Settings>({
    apiKey: '',
    backendUrl: 'http://localhost:5000',
    selectedLanguages: ['es']
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cacheSize, setCacheSize] = useState(0);

  useEffect(() => {
    loadSettings();
    loadCacheSize();
  }, []);

  const loadSettings = async () => {
    try {
      const loadedSettings = await storage.getSettings();
      setSettings(loadedSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCacheSize = async () => {
    try {
      const size = await cacheManager.getCacheSize();
      setCacheSize(size);
    } catch (error) {
      console.error('Error loading cache size:', error);
    }
  };

  const handleSave = async () => {
    try {
      await storage.saveSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleChange = (key: keyof Settings, value: string | string[]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const toggleLanguage = (langCode: string) => {
    const newLangs = settings.selectedLanguages.includes(langCode)
      ? settings.selectedLanguages.filter(l => l !== langCode)
      : [...settings.selectedLanguages, langCode];

    if (newLangs.length === 0) return;

    handleChange('selectedLanguages', newLangs);
  };

  const handleClearCache = async () => {
    if (window.confirm('Are you sure you want to clear all cached translations?')) {
      try {
        await cacheManager.clearCache();
        setCacheSize(0);
        alert('Cache cleared!');
      } catch (error) {
        console.error('Error clearing cache:', error);
        alert('Failed to clear cache');
      }
    }
  };

  if (loading) {
    return <div className="popup-container">Loading...</div>;
  }

  return (
    <div className="popup-container">
      <h1>AI Video Translator</h1>

      <div className="form-group">
        <label htmlFor="apiKey">OpenAI API Key</label>
        <input
          id="apiKey"
          type="password"
          value={settings.apiKey}
          onChange={(e) => handleChange('apiKey', e.target.value)}
          placeholder="sk-..."
        />
        <small>Your API key is stored locally</small>
      </div>

      <div className="form-group">
        <label htmlFor="backendUrl">Backend URL</label>
        <input
          id="backendUrl"
          type="text"
          value={settings.backendUrl}
          onChange={(e) => handleChange('backendUrl', e.target.value)}
          placeholder="http://localhost:5000"
        />
      </div>

      <div className="form-group">
        <label>Target Languages</label>
        <div className="language-grid">
          {LANGUAGES.map(lang => (
            <label key={lang.code} className="language-checkbox">
              <input
                type="checkbox"
                checked={settings.selectedLanguages.includes(lang.code)}
                onChange={() => toggleLanguage(lang.code)}
              />
              <span>{lang.name}</span>
            </label>
          ))}
        </div>
        <small>{settings.selectedLanguages.length} language(s) selected</small>
      </div>

      <button className="save-button" onClick={handleSave}>
        {saved ? 'Saved!' : 'Save Settings'}
      </button>

      <div className="cache-section">
        <h3>Cache</h3>
        <p>Cached videos: {cacheSize}</p>
        <button className="clear-cache-button" onClick={handleClearCache}>
          Clear Cache
        </button>
      </div>

      <div className="instructions">
        <h3>Supported Platforms:</h3>
        <ul>
          <li>YouTube</li>
          <li>Netflix</li>
          <li>Amazon Prime Video</li>
          <li>Twitch</li>
          <li>Vimeo</li>
        </ul>
        <h3>How to use:</h3>
        <ol>
          <li>Enter your OpenAI API key</li>
          <li>Select target language(s)</li>
          <li>Go to a video</li>
          <li>Click the extension icon</li>
          <li>Click "Translate Video"</li>
        </ol>
      </div>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<Popup />);
}
