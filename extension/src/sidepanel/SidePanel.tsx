import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { TranscriptionSegment, Message, ProcessingOptions } from '../types';
import { storage } from '../utils/storage';
import { cacheManager } from '../utils/cache';
import './sidepanel.css';

const SidePanel: React.FC = () => {
  const [translations, setTranslations] = useState<{[lang: string]: TranscriptionSegment[]}>({});
  const [activeLanguage, setActiveLanguage] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [cached, setCached] = useState(false);
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [useTimeRange, setUseTimeRange] = useState(false);
  const activeSegmentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getCurrentVideoUrl();

    const messageListener = (message: Message) => {
      if (message.type === 'UPDATE_TIME') {
        setCurrentTime(message.data.currentTime);
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  useEffect(() => {
    if (activeSegmentRef.current) {
      activeSegmentRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [currentTime]);

  const getCurrentVideoUrl = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      setVideoUrl(tab.url);
    }
  };

  const parseTimeToSeconds = (timeStr: string): number | undefined => {
    if (!timeStr) return undefined;
    const parts = timeStr.split(':').reverse();
    let seconds = 0;
    if (parts[0]) seconds += parseInt(parts[0]);
    if (parts[1]) seconds += parseInt(parts[1]) * 60;
    if (parts[2]) seconds += parseInt(parts[2]) * 3600;
    return seconds;
  };

  const handleTranslate = async () => {
    if (!videoUrl) {
      setError('Please navigate to a video first');
      return;
    }

    setLoading(true);
    setError('');
    setCached(false);

    try {
      const settings = await storage.getSettings();

      if (!settings.apiKey) {
        throw new Error('Please configure your OpenAI API key in the extension settings');
      }

      if (settings.selectedLanguages.length === 0) {
        throw new Error('Please select at least one target language');
      }

      const cachedTranslations: {[lang: string]: TranscriptionSegment[]} = {};
      const languagesToProcess: string[] = [];

      for (const lang of settings.selectedLanguages) {
        const cached = await cacheManager.getCachedTranslation(videoUrl, lang);
        if (cached) {
          cachedTranslations[lang] = cached.translation;
        } else {
          languagesToProcess.push(lang);
        }
      }

      if (languagesToProcess.length === 0) {
        setTranslations(cachedTranslations);
        setActiveLanguage(settings.selectedLanguages[0]);
        setCached(true);
        setLoading(false);
        return;
      }

      const options: ProcessingOptions = {
        videoUrl: videoUrl,
        targetLanguages: languagesToProcess
      };

      if (useTimeRange) {
        const start = parseTimeToSeconds(startTime);
        const end = parseTimeToSeconds(endTime);
        if (start !== undefined) options.startTime = start;
        if (end !== undefined) options.endTime = end;
      }

      const response = await chrome.runtime.sendMessage({
        type: 'TRANSLATE_VIDEO',
        data: options
      });

      if (response.error) {
        throw new Error(response.error);
      }

      if (response.success) {
        const allTranslations = { ...cachedTranslations, ...response.translations };
        setTranslations(allTranslations);
        setActiveLanguage(settings.selectedLanguages[0]);

        for (const lang of languagesToProcess) {
          await cacheManager.saveTranslation(
            videoUrl,
            lang,
            response.original,
            response.translations[lang]
          );
        }

        if (Object.keys(cachedTranslations).length > 0) {
          setCached(true);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getActiveSegment = (time: number, segments: TranscriptionSegment[]): number => {
    return segments.findIndex(
      seg => time >= seg.start && time <= seg.end
    );
  };

  const currentSegments = activeLanguage ? translations[activeLanguage] : [];
  const activeIndex = getActiveSegment(currentTime, currentSegments);
  const availableLanguages = Object.keys(translations);

  return (
    <div className="sidepanel-container">
      <header className="sidepanel-header">
        <h1>Video Translation</h1>

        <div className="time-range-section">
          <label className="time-range-toggle">
            <input
              type="checkbox"
              checked={useTimeRange}
              onChange={(e) => setUseTimeRange(e.target.checked)}
            />
            <span>Translate specific time range</span>
          </label>

          {useTimeRange && (
            <div className="time-inputs">
              <input
                type="text"
                placeholder="Start (mm:ss)"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
              <span>to</span>
              <input
                type="text"
                placeholder="End (mm:ss)"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          )}
        </div>

        <button
          className="translate-button"
          onClick={handleTranslate}
          disabled={loading || !videoUrl}
        >
          {loading ? 'Processing...' : 'Translate Video'}
        </button>

        {cached && (
          <div className="cached-indicator">
            Using cached translation
          </div>
        )}
      </header>

      {availableLanguages.length > 0 && (
        <div className="language-tabs">
          {availableLanguages.map(lang => (
            <button
              key={lang}
              className={`language-tab ${activeLanguage === lang ? 'active' : ''}`}
              onClick={() => setActiveLanguage(lang)}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {loading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Processing video... This may take a few minutes.</p>
          <small>Extracting audio, transcribing, and translating...</small>
        </div>
      )}

      <div className="segments-container">
        {currentSegments.length === 0 && !loading && (
          <div className="empty-state">
            <p>No translations yet</p>
            <small>Click "Translate Video" to get started</small>
          </div>
        )}

        {currentSegments.map((segment, index) => (
          <div
            key={index}
            ref={index === activeIndex ? activeSegmentRef : null}
            className={`segment ${index === activeIndex ? 'active' : ''}`}
          >
            <div className="segment-time">
              {formatTime(segment.start)} - {formatTime(segment.end)}
            </div>
            <div className="segment-text">{segment.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<SidePanel />);
}
