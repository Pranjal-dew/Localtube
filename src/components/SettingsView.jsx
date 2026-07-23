import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, RefreshCw, MessageSquare, HardDrive, Sliders, ShieldCheck, Check, Sparkles, FolderDown, RotateCcw, Trash2, Video } from 'lucide-react';
import { db } from '../services/db';

export default function SettingsView({ onSettingsSaved }) {
  const [settings, setSettings] = useState({
    maxTopComments: 100,
    maxSubComments: 20,
    maxNestedSubComments: 10,
    downloadQuality: 'best',
    autoSavePlayback: true,
    themeMode: 'dark',
    downloadDirectory: '~/Videos/LocalTubeDownloads'
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isFetchingHealth, setIsFetchingHealth] = useState(false);
  const [healthStatus, setHealthStatus] = useState(null);

  useEffect(() => {
    loadSettings();
    checkBackendHealth();
  }, []);

  const loadSettings = () => {
    const s = db.getSettings();
    setSettings(s);
  };

  const checkBackendHealth = async () => {
    setIsFetchingHealth(true);
    try {
      const res = await fetch('http://localhost:3001/api/health');
      if (res.ok) {
        const data = await res.json();
        setHealthStatus(data);
      } else {
        setHealthStatus({ status: 'offline' });
      }
    } catch (e) {
      setHealthStatus({ status: 'offline' });
    } finally {
      setIsFetchingHealth(false);
    }
  };

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    db.updateSettings(settings);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
    if (onSettingsSaved) onSettingsSaved();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-[#272727] pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <SettingsIcon className="w-6 h-6 text-red-500" />
            <span>LocalTube Preferences & Settings</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Configure YouTube comment extraction limits, video downloader quality, and local storage rules.
          </p>
        </div>

        <button
          onClick={checkBackendHealth}
          disabled={isFetchingHealth}
          className="bg-[#1f1f1f] hover:bg-[#252525] border border-[#3f3f3f] text-gray-300 text-xs px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetchingHealth ? 'animate-spin text-red-500' : ''}`} />
          <span>Fetch Server Health</span>
        </button>
      </div>

      {/* Backend Status Banner */}
      {healthStatus && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between ${
          healthStatus.status === 'ok' 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
            : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
        }`}>
          <div className="flex items-center space-x-3">
            <ShieldCheck className="w-5 h-5 shrink-0" />
            <div>
              <p className="text-xs font-bold">
                {healthStatus.status === 'ok' ? 'yt-dlp Downloader Backend Connected' : 'Express Backend Not Detected'}
              </p>
              <p className="text-[11px] opacity-80 mt-0.5">
                {healthStatus.status === 'ok' 
                  ? `yt-dlp ${healthStatus.ytdlpVersion} | Saving to ${healthStatus.downloadDir}`
                  : 'Run "npm run start" in terminal to connect local yt-dlp downloader API on port 3001.'}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-1 rounded bg-black/40 border border-current">
            :3001
          </span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Comment Extraction Limits */}
        <div className="bg-[#1f1f1f] border border-[#272727] p-5 rounded-2xl space-y-4">
          <div className="flex items-center space-x-2 border-b border-[#272727] pb-3">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold text-white">YouTube Comment Extraction Limits</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Top-Level Comments (Max Limit)</label>
              <input
                type="number"
                min="5"
                max="500"
                value={settings.maxTopComments}
                onChange={(e) => handleChange('maxTopComments', parseInt(e.target.value, 10))}
                className="w-full bg-[#121212] text-white border border-[#3f3f3f] px-3 py-2 rounded-xl text-xs font-mono focus:outline-none focus:border-red-500"
              />
              <p className="text-[10px] text-gray-500">Sorted by likes count (Default: 100)</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Sub-Comments per Thread (Max)</label>
              <input
                type="number"
                min="1"
                max="100"
                value={settings.maxSubComments}
                onChange={(e) => handleChange('maxSubComments', parseInt(e.target.value, 10))}
                className="w-full bg-[#121212] text-white border border-[#3f3f3f] px-3 py-2 rounded-xl text-xs font-mono focus:outline-none focus:border-red-500"
              />
              <p className="text-[10px] text-gray-500">Direct replies per comment (Default: 20)</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Nested Sub-Comments (Max)</label>
              <input
                type="number"
                min="0"
                max="50"
                value={settings.maxNestedSubComments}
                onChange={(e) => handleChange('maxNestedSubComments', parseInt(e.target.value, 10))}
                className="w-full bg-[#121212] text-white border border-[#3f3f3f] px-3 py-2 rounded-xl text-xs font-mono focus:outline-none focus:border-red-500"
              />
              <p className="text-[10px] text-gray-500">Level 2+ thread replies (Default: 10)</p>
            </div>
          </div>
        </div>

        {/* Video Downloader & Media Rules */}
        <div className="bg-[#1f1f1f] border border-[#272727] p-5 rounded-2xl space-y-4">
          <div className="flex items-center space-x-2 border-b border-[#272727] pb-3">
            <HardDrive className="w-5 h-5 text-red-500" />
            <h2 className="text-sm font-bold text-white">Downloader & Playback Defaults</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Preferred Video Format Quality</label>
              <select
                value={settings.downloadQuality}
                onChange={(e) => handleChange('downloadQuality', e.target.value)}
                className="w-full bg-[#121212] text-white border border-[#3f3f3f] px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-red-500"
              >
                <option value="best">Best Quality MP4 (Single Container)</option>
                <option value="1080p">1080p (Requires ffmpeg)</option>
                <option value="720p">720p HD</option>
                <option value="480p">480p SD</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Bypass Bot Check (Cookies)</label>
              <select
                value={settings.cookiesFromBrowser || 'chrome'}
                onChange={(e) => handleChange('cookiesFromBrowser', e.target.value)}
                className="w-full bg-[#121212] text-emerald-400 font-semibold border border-[#3f3f3f] px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="chrome">Google Chrome (Recommended)</option>
                <option value="brave">Brave Browser</option>
                <option value="firefox">Mozilla Firefox</option>
                <option value="edge">Microsoft Edge</option>
                <option value="none">Disabled (No Cookies)</option>
              </select>
              <p className="text-[10px] text-gray-500">Fixes "Sign in to confirm you're not a bot"</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Local Download Directory</label>
              <div className="relative">
                <input
                  type="text"
                  value={settings.downloadDirectory}
                  onChange={(e) => handleChange('downloadDirectory', e.target.value)}
                  className="w-full bg-[#121212] text-white border border-[#3f3f3f] px-3 py-2 rounded-xl text-xs font-mono focus:outline-none focus:border-red-500"
                />
                <FolderDown className="w-4 h-4 text-gray-500 absolute right-3 top-2.5" />
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="autoSave"
                checked={settings.autoSavePlayback}
                onChange={(e) => handleChange('autoSavePlayback', e.target.checked)}
                className="w-4 h-4 accent-red-600 rounded cursor-pointer"
              />
              <label htmlFor="autoSave" className="text-xs text-gray-300 cursor-pointer">
                Automatically save playback timestamp position every 5 seconds
              </label>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-between pt-2">
          {savedSuccess ? (
            <div className="flex items-center space-x-1.5 text-emerald-400 text-xs font-semibold animate-popover">
              <Check className="w-4 h-4" />
              <span>Settings saved & synced with local backend!</span>
            </div>
          ) : <div />}

          <button
            type="submit"
            className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-6 py-2.5 rounded-xl flex items-center space-x-2 shadow-lg shadow-red-600/20 active:scale-95 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </div>
      </form>
    </div>
  );
}
