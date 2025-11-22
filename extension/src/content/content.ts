import { Message } from '../types';

console.log('Video translator loaded');

function detectPlatform(): string {
  const u = window.location.href;
  if (u.includes('youtube.com')) return 'youtube';
  if (u.includes('netflix.com')) return 'netflix';
  if (u.includes('amazon.com') || u.includes('primevideo.com')) return 'prime';
  if (u.includes('twitch.tv')) return 'twitch';
  if (u.includes('vimeo.com')) return 'vimeo';
  return 'generic';
}

function getCurrentVideoUrl(): string | null {
  const u = window.location.href;
  const p = detectPlatform();

  if (p === 'youtube') {
    if (u.includes('youtube.com/watch')) return u;
  } else if (p === 'netflix') {
    if (u.includes('netflix.com/watch')) return u;
  } else if (p === 'prime') {
    if (u.includes('/watch') || u.includes('/detail')) return u;
  } else if (p === 'twitch') {
    if (u.includes('twitch.tv/videos')) return u;
  } else if (p === 'vimeo') {
    if (u.match(/vimeo\.com\/\d+/)) return u;
  } else {
    const v = getVideoPlayer();
    if (v && v.src) return v.src;
  }

  return null;
}

chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  if (message.type === 'GET_VIDEO_URL') {
    const videoUrl = getCurrentVideoUrl();
    const p = detectPlatform();
    sendResponse({ videoUrl, platform: p });
  }
});

function getVideoPlayer(): HTMLVideoElement | null {
  const v = document.querySelector('video');
  if (v) return v;

  const p = detectPlatform();
  if (p === 'youtube') {
    return document.querySelector('.html5-main-video') as HTMLVideoElement;
  } else if (p === 'netflix') {
    return document.querySelector('.VideoContainer video') as HTMLVideoElement;
  } else if (p === 'prime') {
    return document.querySelector('.rendererContainer video') as HTMLVideoElement;
  } else if (p === 'twitch') {
    return document.querySelector('.video-player video') as HTMLVideoElement;
  }
  return null;
}

let t: number;

function startTimeSync() {
  if (t) {
    clearInterval(t);
  }

  t = window.setInterval(() => {
    const el = getVideoPlayer();
    if (el && !el.paused) {
      chrome.runtime.sendMessage({
        type: 'UPDATE_TIME',
        data: { currentTime: el.currentTime }
      });
    }
  }, 500);
}

const observer = new MutationObserver(() => {
  const el = getVideoPlayer();
  if (el) {
    el.addEventListener('play', startTimeSync);
    el.addEventListener('pause', () => {
      if (t) {
        clearInterval(t);
      }
    });
    observer.disconnect();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
