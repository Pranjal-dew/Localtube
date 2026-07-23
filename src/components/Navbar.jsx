import React, { useState, useEffect } from 'react';
import { Download, Search, FolderHeart, History, Youtube, HardDrive, Plus, Sparkles, Settings, ListVideo, Trash2, Users } from 'lucide-react';
import { downloader } from '../services/downloader';

export default function Navbar({ 
  onOpenDownload, 
  onOpenSearch, 
  onOpenCollections, 
  onOpenHistory,
  onOpenCreators,
  activeTab,
  setActiveTab 
}) {
  const [downloadCount, setDownloadCount] = useState(0);

  useEffect(() => {
    return downloader.subscribe((queue) => {
      const active = queue.filter(q => q.status === 'downloading' || q.status === 'parsing').length;
      setDownloadCount(active);
    });
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-[#0f0f0f]/95 backdrop-blur-md border-b border-[#272727] px-4 py-2.5 flex items-center justify-between">
      {/* Brand & Logo */}
      <div className="flex items-center space-x-3">
        <button 
          onClick={() => {
            setActiveTab('collections');
            if (onOpenCollections) onOpenCollections();
          }}
          className="flex items-center space-x-2 group focus:outline-none"
        >
          <div className="bg-red-600 text-white p-1.5 rounded-xl shadow-lg shadow-red-600/20 group-hover:scale-105 transition-transform">
            <Youtube className="w-6 h-6 fill-current" />
          </div>
          <div className="flex flex-col text-left">
            <div className="flex items-center space-x-1">
              <span className="font-bold text-xl tracking-tight text-white font-sans">LocalTube</span>
              <span className="bg-red-500/10 text-red-500 text-[10px] font-semibold px-1.5 py-0.5 rounded border border-red-500/20">
                OFFLINE
              </span>
            </div>
            <span className="text-[10px] text-gray-400 -mt-1">Local YouTube Desktop App</span>
          </div>
        </button>

        {/* Downloader Trigger - Placed directly right to logo */}
        <button
          onClick={onOpenDownload}
          className="relative bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-md shadow-red-600/20 active:scale-95 shrink-0"
          title="Add YouTube Video or Playlist URL"
        >
          <Plus className="w-4 h-4" />
          <span>Add</span>
          {downloadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
              {downloadCount}
            </span>
          )}
        </button>

        {/* Primary View Tabs */}
        <nav className="hidden md:flex items-center space-x-1 bg-[#1f1f1f] p-1 rounded-lg border border-[#272727]">
          <button
            onClick={() => {
              setActiveTab('collections');
              if (onOpenCollections) onOpenCollections();
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center space-x-1.5 ${
              activeTab === 'collections' ? 'bg-[#272727] text-white shadow-sm' : 'text-gray-400 hover:text-white'
            }`}
          >
            <FolderHeart className="w-3.5 h-3.5 text-red-500" />
            <span>Home</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('creators');
              if (onOpenCreators) onOpenCreators();
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center space-x-1.5 ${
              activeTab === 'creators' ? 'bg-[#272727] text-white shadow-sm' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>Creators</span>
          </button>

          <button
            onClick={() => setActiveTab('manage_playlists')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center space-x-1.5 ${
              activeTab === 'manage_playlists' ? 'bg-[#272727] text-white shadow-sm' : 'text-gray-400 hover:text-white'
            }`}
          >
            <ListVideo className="w-3.5 h-3.5 text-red-400" />
            <span>Playlists & Collections</span>
          </button>

          <button
            onClick={() => setActiveTab('manage_videos')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center space-x-1.5 ${
              activeTab === 'manage_videos' ? 'bg-[#272727] text-white shadow-sm' : 'text-gray-400 hover:text-white'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Manage Videos</span>
          </button>

          <button
            onClick={onOpenHistory}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center space-x-1.5 ${
              activeTab === 'history' ? 'bg-[#272727] text-white shadow-sm' : 'text-gray-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Watch History</span>
          </button>
        </nav>
      </div>

      {/* Global Search Trigger Bar */}
      <div className="flex-1 max-w-xl mx-4">
        <button
          onClick={onOpenSearch}
          className="w-full bg-[#121212] hover:bg-[#1f1f1f] text-gray-400 hover:text-gray-200 border border-[#272727] hover:border-[#3f3f3f] px-4 py-2 rounded-full flex items-center justify-between text-xs transition-all shadow-inner group"
        >
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-gray-400 group-hover:text-red-500 transition-colors" />
            <span>Search titles, YT comments, and local notes (FTS5)...</span>
          </div>
          <kbd className="hidden sm:inline-block bg-[#272727] text-gray-400 px-2 py-0.5 rounded text-[10px] font-mono border border-[#3f3f3f]">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-2">
        {/* Recycle Bin Button - directly left of Settings */}
        <button
          onClick={() => setActiveTab('bin')}
          className={`p-2 rounded-full border transition-all ${
            activeTab === 'bin'
              ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
              : 'bg-[#1f1f1f] hover:bg-[#252525] border-[#272727] text-gray-400 hover:text-white'
          }`}
          title="Recycle Bin (Deleted Notes)"
        >
          <Trash2 className="w-4 h-4 text-yellow-400" />
        </button>

        {/* Settings Button */}
        <button
          onClick={() => setActiveTab('settings')}
          className={`p-2 rounded-full border transition-all ${
            activeTab === 'settings'
              ? 'bg-red-600/20 border-red-500/50 text-red-400'
              : 'bg-[#1f1f1f] hover:bg-[#252525] border-[#272727] text-gray-400 hover:text-white'
          }`}
          title="Settings & Preferences"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
