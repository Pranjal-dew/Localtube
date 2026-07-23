import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import VideoPlayer from './components/VideoPlayer';
import CommentPanel from './components/CommentPanel';
import DownloadModal from './components/DownloadModal';
import SearchModal from './components/SearchModal';
import CollectionsModal from './components/CollectionsModal';
import CollectionsView from './components/CollectionsView';
import WatchHistory from './components/WatchHistory';
import SettingsView from './components/SettingsView';
import BinView from './components/BinView';
import VideoManagerView from './components/VideoManagerView';
import PlaylistsManagerView from './components/PlaylistsManagerView';
import CreatorsView from './components/CreatorsView';
import { db } from './services/db';
import { Play, Download, Plus, Sparkles, Clock, FolderHeart, Trash2, ArrowLeft } from 'lucide-react';

export default function App() {
  const [videos, setVideos] = useState([]);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [currentComments, setCurrentComments] = useState([]);
  const [activeTab, setActiveTab] = useState('collections'); // Homepage default tab: 'collections' | 'feed' | 'history' | 'creators'
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [selectedCreator, setSelectedCreator] = useState(null);
  
  // Modals
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCollectionsOpen, setIsCollectionsOpen] = useState(false);

  // Quick Timestamp Capture Bridge
  const [quickNoteTimestamp, setQuickNoteTimestamp] = useState(null);

  useEffect(() => {
    refreshLibrary();
  }, []);

  const refreshLibrary = () => {
    const vids = db.getVideos();
    setVideos(vids);
    if (vids.length > 0 && !currentVideo) {
      selectVideo(vids[0]);
    } else if (currentVideo) {
      // Refresh current video details
      const updated = db.getVideoById(currentVideo.id);
      if (updated) setCurrentVideo(updated);
      refreshComments(currentVideo.id);
    }
  };

  const selectVideo = (video, seekTimeSec = null) => {
    setCurrentVideo(video);
    refreshComments(video.id);
    if (seekTimeSec !== null && seekTimeSec !== undefined) {
      setQuickNoteTimestamp(seekTimeSec);
    }
  };

  const refreshComments = (videoId) => {
    if (!videoId) return;
    const comments = db.getComments(videoId);
    setCurrentComments(comments);
  };

  const handleDeleteVideo = (e, videoId) => {
    e.stopPropagation();
    db.deleteVideo(videoId);
    refreshLibrary();
    if (currentVideo?.id === videoId) {
      const remaining = db.getVideos();
      setCurrentVideo(remaining.length > 0 ? remaining[0] : null);
    }
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds === null) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSelectCollection = (col) => {
    setSelectedCollection(col);
    setActiveTab('collections');
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-gray-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        onOpenDownload={() => setIsDownloadOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenCollections={() => {
          setSelectedCollection(null);
          setActiveTab('collections');
        }}
        onOpenHistory={() => setActiveTab('history')}
        onOpenCreators={() => {
          setSelectedCreator(null);
          setActiveTab('creators');
        }}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'collections') setSelectedCollection(null);
          if (tab === 'creators') setSelectedCreator(null);
          setActiveTab(tab);
        }}
      />

      {/* Main Content Body */}
      <main className="flex-1 px-4 py-6 max-w-7xl w-full mx-auto">
        {/* HOMEPAGE: COLLECTIONS GRID TAB */}
        {activeTab === 'collections' && !selectedCollection && (
          <CollectionsView
            onSelectVideo={(video) => {
              selectVideo(video);
              setActiveTab('feed');
            }}
            onSelectCollection={(col) => handleSelectCollection(col)}
          />
        )}

        {/* DEDICATED PLAYLIST PAGE VIEW */}
        {activeTab === 'collections' && selectedCollection && (
          <div className="space-y-6 animate-fade-in">
            {/* Playlist Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#272727] pb-4 gap-4">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setSelectedCollection(null)}
                  className="bg-[#1f1f1f] hover:bg-[#252525] p-2.5 rounded-xl border border-[#3f3f3f] text-gray-300 hover:text-white transition-colors flex items-center space-x-1.5 text-xs font-semibold"
                  title="Back to Home Feed"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Home</span>
                </button>
                <div>
                  <h1 className="text-xl font-bold text-white flex items-center space-x-2">
                    <FolderHeart className="w-5 h-5 text-red-500" />
                    <span>{selectedCollection.name}</span>
                  </h1>
                  <p className="text-xs text-gray-400 mt-0.5">{selectedCollection.description || 'Playlist video collection'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <span className="bg-[#272727] text-gray-300 text-xs px-3 py-1 rounded-full font-semibold border border-[#3f3f3f]">
                  {db.getCollectionItems(selectedCollection.id).length} videos
                </span>
                {db.getCollectionItems(selectedCollection.id).length > 0 && (
                  <button
                    onClick={() => {
                      const items = db.getCollectionItems(selectedCollection.id);
                      if (items.length > 0 && items[0].video) {
                        selectVideo(items[0].video);
                        setActiveTab('feed');
                      }
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center space-x-1.5 shadow-md shadow-red-600/20 active:scale-95 transition-all"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Play All</span>
                  </button>
                )}
              </div>
            </div>

            {/* Collection Videos List */}
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-white">All Videos in Playlist</h2>
              {db.getCollectionItems(selectedCollection.id).length === 0 ? (
                <div className="bg-[#1f1f1f] border border-[#272727] rounded-2xl p-12 text-center text-gray-400 space-y-2">
                  <p className="text-sm font-semibold">This playlist is currently empty.</p>
                  <p className="text-xs text-gray-500">Add videos to this playlist from the Playlists & Collections manager!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {db.getCollectionItems(selectedCollection.id).map(({ video }) => (
                    video && (
                      <div
                        key={video.id}
                        onClick={() => {
                          selectVideo(video);
                          setActiveTab('feed');
                        }}
                        className="bg-[#1f1f1f] hover:bg-[#252525] border border-[#272727] hover:border-red-500/50 rounded-xl overflow-hidden cursor-pointer transition-all shadow-md group flex flex-col justify-between"
                      >
                        <div className="relative aspect-video bg-black overflow-hidden">
                          <img
                            src={video.thumbnail_path || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80'}
                            alt={video.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play className="w-8 h-8 text-white fill-current" />
                          </div>
                          <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-gray-200 text-[10px] font-mono px-1.5 py-0.5 rounded">
                            {formatTime(video.duration_sec)}
                          </span>
                        </div>
                        <div className="p-3 space-y-1 flex-1 flex flex-col justify-between">
                          <h3 className="text-xs font-bold text-white line-clamp-2 leading-snug group-hover:text-red-400 transition-colors">
                            {video.title}
                          </h3>
                          <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
                            <span className="truncate">{video.channel_name}</span>
                            {video.completion_percent > 0 && (
                              <span className="text-[10px] text-emerald-400 font-mono shrink-0 ml-1">
                                {Math.round(video.completion_percent)}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* CREATORS TAB */}
        {activeTab === 'creators' && (
          <CreatorsView
            selectedCreatorName={selectedCreator}
            onSelectCreator={(creatorName) => {
              setSelectedCreator(creatorName);
              setActiveTab('creators');
            }}
            onSelectVideo={(video) => {
              selectVideo(video);
              setActiveTab('feed');
            }}
            onSelectCollection={(col) => handleSelectCollection(col)}
          />
        )}

        {/* WATCH HISTORY TAB */}
        {activeTab === 'history' && (
          <WatchHistory
            videos={videos}
            onSelectVideo={(video) => {
              selectVideo(video);
              setActiveTab('feed');
            }}
          />
        )}

        {/* SETTINGS PREFERENCES TAB */}
        {activeTab === 'settings' && (
          <SettingsView
            onSettingsSaved={refreshLibrary}
          />
        )}

        {/* RECYCLE BIN TAB */}
        {activeTab === 'bin' && (
          <BinView
            onRefresh={refreshLibrary}
            onSelectVideo={(video) => {
              selectVideo(video);
              setActiveTab('feed');
            }}
          />
        )}

        {/* MANAGE VIDEOS MANAGER TAB */}
        {activeTab === 'manage_videos' && (
          <VideoManagerView
            videos={videos}
            onRefresh={refreshLibrary}
            onSelectVideo={(video) => {
              selectVideo(video);
              setActiveTab('feed');
            }}
            onOpenDownload={() => setIsDownloadOpen(true)}
          />
        )}

        {/* MANAGE PLAYLISTS & COLLECTIONS TAB */}
        {activeTab === 'manage_playlists' && (
          <PlaylistsManagerView
            onRefresh={refreshLibrary}
            onSelectVideo={(video) => {
              selectVideo(video);
              setActiveTab('feed');
            }}
          />
        )}

        {/* ALL VIDEOS LIBRARY FEED VIEW */}
        {activeTab === 'feed' && (
          <div className="space-y-8">
            {currentVideo ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <VideoPlayer
                    video={currentVideo}
                    comments={currentComments}
                    onAddQuickNote={(currentTimeSec) => {
                      setQuickNoteTimestamp(currentTimeSec);
                    }}
                    onSelectCreator={(creatorName) => {
                      setSelectedCreator(creatorName);
                      setActiveTab('creators');
                    }}
                  />
                </div>
                <div className="lg:col-span-1">
                  <CommentPanel
                    video={currentVideo}
                    comments={currentComments}
                    onRefreshComments={() => refreshComments(currentVideo.id)}
                    onSeek={(timeSec) => {
                      const playerVideoEl = document.querySelector('video');
                      if (playerVideoEl) {
                        playerVideoEl.currentTime = timeSec;
                        playerVideoEl.play();
                      }
                    }}
                    quickNoteTimestamp={quickNoteTimestamp}
                    clearQuickNoteTimestamp={() => setQuickNoteTimestamp(null)}
                  />
                </div>
              </div>
            ) : (
              <div className="bg-[#1f1f1f] border border-[#272727] rounded-2xl p-12 text-center text-gray-400 space-y-3">
                <p className="text-sm font-semibold">Your Local YouTube Library is empty.</p>
                <button
                  onClick={() => setIsDownloadOpen(true)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center space-x-2 shadow-lg shadow-red-600/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>Download First Video with yt-dlp</span>
                </button>
              </div>
            )}

            <div className="space-y-4 pt-4 border-t border-[#272727]">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <h2 className="text-base font-bold text-white tracking-tight">Downloaded Offline Library</h2>
                  <span className="bg-[#272727] text-gray-300 text-xs px-2 py-0.5 rounded font-mono">
                    {videos.length} videos
                  </span>
                </div>

                <button
                  onClick={() => setIsDownloadOpen(true)}
                  className="bg-[#1f1f1f] hover:bg-[#252525] border border-[#3f3f3f] text-gray-200 text-xs px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-red-500" />
                  <span>Add Video URL</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {videos.map((vid) => (
                  <div
                    key={vid.id}
                    onClick={() => selectVideo(vid)}
                    className={`bg-[#1f1f1f] hover:bg-[#252525] border rounded-2xl overflow-hidden cursor-pointer transition-all shadow-lg group flex flex-col justify-between ${
                      currentVideo?.id === vid.id
                        ? 'border-red-500 ring-2 ring-red-500/20 shadow-red-500/10'
                        : 'border-[#272727] hover:border-[#3f3f3f]'
                    }`}
                  >
                    <div className="relative aspect-video bg-black overflow-hidden">
                      <img
                        src={vid.thumbnail_path}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                      <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-mono px-1.5 py-0.5 rounded">
                        {formatTime(vid.duration_sec)}
                      </span>
                      {vid.completion_percent > 0 && (
                        <div className="absolute inset-x-0 bottom-0 h-1 bg-gray-700/80">
                          <div 
                            className="h-full bg-red-600"
                            style={{ width: `${vid.completion_percent}%` }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="p-3 space-y-1">
                      <div className="flex items-start justify-between">
                        <h3 className="text-xs font-bold text-white line-clamp-2 leading-snug group-hover:text-red-400 transition-colors">
                          {vid.title}
                        </h3>
                        <button
                          onClick={(e) => handleDeleteVideo(e, vid.id)}
                          className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 p-1 transition-opacity"
                          title="Delete from local library"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[11px] text-gray-400">{vid.channel_name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <DownloadModal
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
        onVideoImported={refreshLibrary}
      />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectSearchResult={(video, timestampSec) => {
          selectVideo(video, timestampSec);
          setActiveTab('feed');
          setTimeout(() => {
            const playerVideoEl = document.querySelector('video');
            if (playerVideoEl) {
              playerVideoEl.currentTime = timestampSec;
              playerVideoEl.play();
            }
          }, 300);
        }}
      />

      <CollectionsModal
        isOpen={isCollectionsOpen}
        onClose={() => setIsCollectionsOpen(false)}
        onSelectVideo={(video) => {
          selectVideo(video);
          setActiveTab('feed');
        }}
      />
    </div>
  );
}

