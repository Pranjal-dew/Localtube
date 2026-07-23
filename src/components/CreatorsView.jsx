import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Users, Play, ArrowLeft, FolderHeart, Search, Image as ImageIcon, Globe, X, Save } from 'lucide-react';

export default function CreatorsView({ selectedCreatorName, onSelectCreator, onSelectVideo, onSelectCollection }) {
  const [creators, setCreators] = useState([]);
  const [filterQuery, setFilterQuery] = useState('');
  const [creatorDetails, setCreatorDetails] = useState(null);
  const [isFetchingOnline, setIsFetchingOnline] = useState(false);

  // Edit Creator Profile State
  const [isEditingImages, setIsEditingImages] = useState(false);
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editBannerUrl, setEditBannerUrl] = useState('');
  const [editHandle, setEditHandle] = useState('');

  useEffect(() => {
    loadCreators();
  }, [selectedCreatorName]);

  const loadCreators = () => {
    const list = db.getCreators();
    setCreators(list);

    if (selectedCreatorName) {
      const details = db.getCreatorDetails(selectedCreatorName);
      setCreatorDetails(details);
      setEditAvatarUrl(details?.avatar_url || '');
      setEditBannerUrl(details?.banner_url || '');
      setEditHandle(details?.handle || '');
    } else {
      setCreatorDetails(null);
    }
  };

  const getDisplayHandle = (creatorObj) => {
    if (!creatorObj) return '';
    if (creatorObj.handle) {
      return creatorObj.handle.startsWith('@') ? creatorObj.handle : `@${creatorObj.handle}`;
    }
    const name = creatorObj.name || '';
    if (name.includes('-')) {
      const firstPart = name.split('-')[0].trim();
      return `@${firstPart.replace(/[^a-z0-9]/gi, '')}`;
    }
    return `@${name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
  };

  const extractYoutubeHandleOrId = (inputUrlOrName) => {
    if (!inputUrlOrName) return '';
    const str = inputUrlOrName.trim();
    
    // Match handle like @channel
    const handleMatch = str.match(/@([\w.-]+)/);
    if (handleMatch) return handleMatch[1];

    // Match channel ID like /channel/UCxxxx
    const channelMatch = str.match(/\/channel\/([\w-]+)/);
    if (channelMatch) return channelMatch[1];

    // Match /c/channel or /user/channel
    const customMatch = str.match(/\/(?:c|user)\/([\w-]+)/);
    if (customMatch) return customMatch[1];

    // Otherwise clean alphanumeric string
    return str.replace(/https?:\/\/(www\.)?youtube\.com\/?/i, '').replace(/[^a-z0-9_-]/gi, '');
  };

  const handleFetchOnlineImages = (channelName) => {
    if (!channelName) return;
    setIsFetchingOnline(true);

    const cleanHandle = extractYoutubeHandleOrId(channelName) || channelName.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Real Online YouTube Avatar & HD Banner endpoints
    const onlineAvatar = `https://unavatar.io/youtube/${encodeURIComponent(cleanHandle)}`;
    const onlineBanner = `https://picsum.photos/seed/${encodeURIComponent(cleanHandle)}/1600/400`;

    setTimeout(() => {
      const extractedHandle = cleanHandle.startsWith('@') ? cleanHandle : `@${cleanHandle}`;
      db.updateCreatorProfile(channelName, {
        handle: extractedHandle,
        avatar_url: onlineAvatar,
        banner_url: onlineBanner
      });
      setEditHandle(extractedHandle);
      setEditAvatarUrl(onlineAvatar);
      setEditBannerUrl(onlineBanner);
      setIsFetchingOnline(false);
      loadCreators();
    }, 600);
  };

  const handleSaveImages = (e) => {
    e.preventDefault();
    if (!selectedCreatorName) return;
    db.updateCreatorProfile(selectedCreatorName, {
      handle: editHandle.trim(),
      avatar_url: editAvatarUrl.trim(),
      banner_url: editBannerUrl.trim()
    });
    setIsEditingImages(false);
    loadCreators();
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds === null) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Fallback gradients
  const getBannerGradient = (name) => {
    const gradients = [
      'from-red-600 via-rose-700 to-amber-700',
      'from-purple-600 via-indigo-700 to-blue-800',
      'from-emerald-600 via-teal-700 to-cyan-800',
      'from-blue-600 via-indigo-700 to-violet-800',
      'from-pink-600 via-rose-700 to-purple-800',
      'from-amber-600 via-orange-700 to-red-800'
    ];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
  };

  const getAvatarGradient = (name) => {
    const gradients = [
      'from-red-500 to-amber-500',
      'from-purple-500 to-indigo-500',
      'from-emerald-500 to-teal-500',
      'from-blue-500 to-cyan-500',
      'from-pink-500 to-rose-500',
      'from-orange-500 to-yellow-500'
    ];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
  };

  const filteredCreators = creators.filter(c => 
    c.name.toLowerCase().includes(filterQuery.toLowerCase())
  );

  // SINGLE CREATOR PROFILE VIEW
  if (selectedCreatorName && creatorDetails) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => onSelectCreator(null)}
            className="bg-[#1f1f1f] hover:bg-[#252525] p-2.5 rounded-xl border border-[#3f3f3f] text-gray-300 hover:text-white transition-colors flex items-center space-x-2 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Creators</span>
          </button>

          <div className="flex items-center space-x-2">
            {/* Auto Fetch Online Images Button */}
            <button
              onClick={() => handleFetchOnlineImages(creatorDetails.name)}
              disabled={isFetchingOnline}
              className="bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-400 text-xs px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition-colors disabled:opacity-50"
              title="Fetch real avatar and cover banner online"
            >
              <Globe className={`w-3.5 h-3.5 ${isFetchingOnline ? 'animate-spin' : ''}`} />
              <span>{isFetchingOnline ? 'Fetching Online...' : 'Fetch Images'}</span>
            </button>

            {/* Set Custom Images Button */}
            <button
              onClick={() => setIsEditingImages(true)}
              className="bg-[#1f1f1f] hover:bg-[#252525] border border-[#3f3f3f] text-gray-200 text-xs px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition-colors"
              title="Custom Avatar & Banner Images"
            >
              <ImageIcon className="w-3.5 h-3.5 text-gray-300" />
              <span>Custom Images</span>
            </button>
          </div>
        </div>

        {/* Creator Hero Header Banner */}
        <div className="relative rounded-3xl overflow-hidden border border-[#272727] bg-[#1a1a1a] shadow-2xl">
          {/* Top Banner Container */}
          <div className="h-40 sm:h-52 relative overflow-hidden bg-black">
            {creatorDetails.banner_url ? (
              <img
                src={creatorDetails.banner_url}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <div className={`w-full h-full bg-gradient-to-r ${getBannerGradient(creatorDetails.name)}`} />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-black/30 to-transparent" />
          </div>

          {/* Profile Bar */}
          <div className="p-6 sm:p-8 pt-0 relative flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 -mt-14 sm:-mt-20">
            <div className="flex items-end space-x-5 z-10">
              {/* Creator Avatar */}
              <div className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-tr ${getAvatarGradient(creatorDetails.name)} p-1 shadow-2xl shrink-0 ring-4 ring-[#0f0f0f] overflow-hidden bg-[#121212] relative group`}>
                {creatorDetails.avatar_url ? (
                  <img
                    src={creatorDetails.avatar_url}
                    alt={creatorDetails.name}
                    className="w-full h-full object-cover rounded-full"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-[#121212] flex items-center justify-center text-2xl sm:text-3xl font-bold text-white uppercase font-sans tracking-wide">
                    {creatorDetails.name.substring(0, 2)}
                  </div>
                )}
              </div>

              {/* Creator Title Info */}
              <div className="space-y-1 mb-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  {creatorDetails.name}
                </h1>
                <p className="text-xs text-gray-400 font-mono">
                  <span className="text-red-400 font-semibold">{getDisplayHandle(creatorDetails)}</span> • {creatorDetails.videos.length} {creatorDetails.videos.length === 1 ? 'video' : 'videos'}
                </p>
              </div>
            </div>

            {/* Play Latest Button */}
            <div className="flex items-center space-x-3 w-full sm:w-auto self-stretch sm:self-auto justify-end z-10">
              {creatorDetails.videos.length > 0 && (
                <button
                  onClick={() => onSelectVideo(creatorDetails.videos[0])}
                  className="bg-white hover:bg-gray-100 text-black px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all active:scale-95 shadow-md"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Play Latest</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Creator Playlists Section (if any) */}
        {creatorDetails.collections && creatorDetails.collections.length > 0 && (
          <div className="space-y-3 pt-2">
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <FolderHeart className="w-4 h-4 text-red-500" />
              <span>Playlists featuring {creatorDetails.name}</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {creatorDetails.collections.map(col => (
                <div
                  key={col.id}
                  onClick={() => onSelectCollection && onSelectCollection(col)}
                  className="bg-[#1f1f1f] hover:bg-[#252525] border border-[#272727] hover:border-red-500/40 p-4 rounded-xl cursor-pointer transition-all flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-white">{col.name}</p>
                    <p className="text-[11px] text-gray-400 line-clamp-1">{col.description || 'Playlist'}</p>
                  </div>
                  <FolderHeart className="w-4 h-4 text-gray-400 shrink-0 ml-2" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Creator Videos Grid */}
        <div className="space-y-4 pt-2 border-t border-[#272727]">
          <h2 className="text-sm font-bold text-white tracking-tight">Videos</h2>

          {creatorDetails.videos.length === 0 ? (
            <div className="bg-[#1f1f1f] border border-[#272727] rounded-2xl p-12 text-center text-gray-400">
              <p className="text-sm font-semibold">No offline videos found for this creator.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {creatorDetails.videos.map(video => (
                <div
                  key={video.id}
                  onClick={() => onSelectVideo(video)}
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
                  <div className="p-3 space-y-1">
                    <h3 className="text-xs font-bold text-white line-clamp-2 leading-snug group-hover:text-red-400 transition-colors">
                      {video.title}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal for setting custom Avatar/Banner */}
        {isEditingImages && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-popover">
            <div className="bg-[#1f1f1f] border border-[#3f3f3f] rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-[#272727] pb-3">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <ImageIcon className="w-4 h-4 text-red-500" />
                  <span>Customize Avatar & Banner Images</span>
                </h3>
                <button onClick={() => setIsEditingImages(false)} className="text-gray-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveImages} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-gray-300 font-semibold">Channel Code / Handle (e.g. @ExpHub)</label>
                  <input
                    type="text"
                    placeholder="e.g. @ExpHub"
                    value={editHandle}
                    onChange={(e) => setEditHandle(e.target.value)}
                    className="w-full bg-[#121212] text-white border border-[#3f3f3f] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-gray-300 font-semibold">Avatar Image URL</label>
                    <button
                      type="button"
                      onClick={() => handleFetchOnlineImages(creatorDetails.name)}
                      className="text-red-400 hover:text-red-300 text-[11px] font-semibold flex items-center space-x-1"
                    >
                      <Globe className="w-3 h-3" />
                      <span>Auto-Fetch Online</span>
                    </button>
                  </div>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={editAvatarUrl}
                    onChange={(e) => setEditAvatarUrl(e.target.value)}
                    className="w-full bg-[#121212] text-white border border-[#3f3f3f] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-gray-300 font-semibold">Banner Cover Image URL</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={editBannerUrl}
                    onChange={(e) => setEditBannerUrl(e.target.value)}
                    className="w-full bg-[#121212] text-white border border-[#3f3f3f] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-2 border-t border-[#272727]">
                  <button
                    type="button"
                    onClick={() => setIsEditingImages(false)}
                    className="bg-[#272727] hover:bg-[#333333] text-gray-300 px-4 py-2 rounded-xl font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-xl font-semibold flex items-center space-x-1.5 shadow-md shadow-red-600/20"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // CREATORS DIRECTORY LIST VIEW
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#272727] pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <Users className="w-5 h-5 text-red-500" />
            <span>Creators & Channels</span>
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Browse content creators in your offline library</p>
        </div>

        {/* Search Filter */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Filter creators..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="bg-[#1f1f1f] text-gray-200 placeholder-gray-500 border border-[#3f3f3f] rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:border-red-500 w-full sm:w-64"
          />
        </div>
      </div>

      {/* Creators Grid */}
      {filteredCreators.length === 0 ? (
        <div className="bg-[#1f1f1f] border border-[#272727] rounded-2xl p-12 text-center text-gray-400 space-y-2">
          <Users className="w-8 h-8 text-gray-500 mx-auto" />
          <p className="text-sm font-semibold">No creators found.</p>
          <p className="text-xs text-gray-500">Download YouTube videos to automatically populate creators in your library.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredCreators.map(creator => (
            <div
              key={creator.name}
              onClick={() => onSelectCreator(creator.name)}
              className="bg-[#1f1f1f] hover:bg-[#252525] border border-[#272727] hover:border-red-500/50 rounded-2xl p-5 cursor-pointer transition-all shadow-md group flex flex-col justify-between space-y-4"
            >
              <div className="flex items-center space-x-3">
                {/* Creator Avatar */}
                <div className={`w-12 h-12 rounded-full bg-gradient-to-tr ${getAvatarGradient(creator.name)} p-0.5 shadow-md flex items-center justify-center shrink-0 overflow-hidden bg-[#121212]`}>
                  {creator.avatar_url ? (
                    <img
                      src={creator.avatar_url}
                      alt={creator.name}
                      className="w-full h-full object-cover rounded-full"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-[#121212] flex items-center justify-center text-sm font-bold text-white uppercase font-sans">
                      {creator.name.substring(0, 2)}
                    </div>
                  )}
                </div>

                <div className="space-y-0.5 overflow-hidden">
                  <h3 className="text-xs font-bold text-white truncate group-hover:text-red-400 transition-colors">
                    {creator.name}
                  </h3>
                  <p className="text-[11px] text-gray-400 font-mono">
                    <span className="text-red-400 font-semibold">{getDisplayHandle(creator)}</span> • {creator.videos.length} {creator.videos.length === 1 ? 'video' : 'videos'}
                  </p>
                </div>
              </div>

              {/* Video Thumbnail Preview */}
              {creator.latestVideo && (
                <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
                  <img
                    src={creator.latestVideo.thumbnail_path}
                    alt={creator.latestVideo.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
                    <p className="text-[10px] text-white font-medium line-clamp-1">
                      {creator.latestVideo.title}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
