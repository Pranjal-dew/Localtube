import React, { useState, useEffect } from 'react';
import { 
  FolderHeart, Folder, Plus, Play, Trash2, Video, Edit3, X, Check, 
  ChevronLeft, ChevronRight, ListVideo, Grid, SlidersHorizontal, 
  ArrowRight, Film, Clock, Sparkles 
} from 'lucide-react';
import { db } from '../services/db';

/**
 * TODO for Future Sorting & Filtering Mechanisms:
 * - Implement custom drag-and-drop ordering for playlists
 * - Add filter by video tags / categories (e.g. CGI, Music, Tech)
 * - Sort playlists by total watch completion / watch progress
 * - Filter uncategorized videos by channel or duration range
 */

export default function CollectionsView({ onSelectVideo, onSelectCollection }) {
  const [collectionsData, setCollectionsData] = useState([]);
  const [uncategorizedVideos, setUncategorizedVideos] = useState([]);
  const [sortBy, setSortBy] = useState('recent_video'); // 'recent_video' | 'alphabetical_asc' | 'alphabetical_desc' | 'video_count' | 'newest_playlist'
  
  // Create / Edit Collection Modals
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const [editingCol, setEditingCol] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  useEffect(() => {
    loadHomeData();
  }, [sortBy]);

  const loadHomeData = () => {
    const cols = db.getCollections();
    const allVideos = db.getVideos();
    const categorizedVideoIds = new Set();

    // Enrich collections with items and videos
    const enriched = cols.map((col) => {
      const items = db.getCollectionItems(col.id);
      
      // Track categorized video IDs
      items.forEach(i => {
        if (i.video_id) categorizedVideoIds.add(i.video_id);
      });

      // Extract valid videos and sort by upload / created date descending (newest leftmost)
      const playlistVideos = items
        .map(i => i.video)
        .filter(Boolean)
        .sort((a, b) => {
          const dateA = new Date(a.created_at || a.last_watched_at || 0).getTime();
          const dateB = new Date(b.created_at || b.last_watched_at || 0).getTime();
          return dateB - dateA;
        });

      // Determine newest video timestamp for playlist-level sorting
      const newestVideoTs = playlistVideos.length > 0
        ? Math.max(...playlistVideos.map(v => new Date(v.created_at || 0).getTime()))
        : new Date(col.created_at || 0).getTime();

      return {
        ...col,
        items,
        playlistVideos,
        videoCount: playlistVideos.length,
        newestVideoTs,
        thumbnails: playlistVideos.slice(0, 4).map(v => v.thumbnail_path).filter(Boolean)
      };
    });

    // Apply selected sorting rule to playlists (Requirement 4)
    enriched.sort((a, b) => {
      if (sortBy === 'recent_video') {
        return b.newestVideoTs - a.newestVideoTs;
      }
      if (sortBy === 'alphabetical_asc') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'alphabetical_desc') {
        return b.name.localeCompare(a.name);
      }
      if (sortBy === 'video_count') {
        return b.videoCount - a.videoCount;
      }
      if (sortBy === 'newest_playlist') {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      }
      return 0;
    });

    setCollectionsData(enriched);

    // Extract uncategorized videos (not in any playlist) (Requirement 5)
    const uncategorized = allVideos.filter(v => !categorizedVideoIds.has(v.id));
    setUncategorizedVideos(uncategorized);
  };

  const scrollRow = (colId, direction) => {
    const el = document.getElementById(`playlist-scroll-${colId}`);
    if (el) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleCreateCollection = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;

    db.createCollection(newName.trim(), newDesc.trim());
    setNewName('');
    setNewDesc('');
    setShowCreateForm(false);
    loadHomeData();
  };

  const handleStartEdit = (e, col) => {
    e.stopPropagation();
    setEditingCol(col);
    setEditName(col.name);
    setEditDesc(col.description || '');
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editName.trim() || !editingCol) return;

    db.updateCollection(editingCol.id, editName.trim(), editDesc.trim());
    setEditingCol(null);
    loadHomeData();
  };

  const handleDeleteCollection = (e, colId) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this playlist collection?")) {
      db.deleteCollection(colId);
      loadHomeData();
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#272727] pb-4 gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <FolderHeart className="w-6 h-6 text-red-500" />
            <span>Home Feed & Playlists</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Browse horizontal playlist rows and standalone local video library.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Sorting Control Bar (Requirement 4) */}
          <div className="flex items-center space-x-1.5 bg-[#1f1f1f] px-3 py-1.5 rounded-xl border border-[#272727] text-xs">
            <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-400 text-[11px] font-medium hidden md:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="recent_video" className="bg-[#191919]">Recent Video Added</option>
              <option value="alphabetical_asc" className="bg-[#191919]">Alphabetical (A - Z)</option>
              <option value="alphabetical_desc" className="bg-[#191919]">Alphabetical (Z - A)</option>
              <option value="video_count" className="bg-[#191919]">Most Videos</option>
              <option value="newest_playlist" className="bg-[#191919]">Newest Playlist</option>
            </select>
          </div>

          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center space-x-1.5 shadow-lg shadow-red-600/20 transition-all active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Playlist</span>
          </button>
        </div>
      </div>

      {/* Create Collection Inline Form */}
      {showCreateForm && (
        <form onSubmit={handleCreateCollection} className="bg-[#1f1f1f] border border-[#3f3f3f] p-4 rounded-2xl space-y-3">
          <h3 className="text-sm font-bold text-white">Create New Playlist Collection</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              required
              placeholder="Playlist Title (e.g. AI Tutorials, Music Videos)..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="bg-[#121212] text-white border border-[#3f3f3f] px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-red-500"
            />
            <input
              type="text"
              placeholder="Description (Optional)..."
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="bg-[#121212] text-white border border-[#3f3f3f] px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-red-500"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-3 py-1.5 text-xs text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 text-xs font-semibold rounded-xl"
            >
              Save Playlist
            </button>
          </div>
        </form>
      )}

      {/* Edit Collection Modal */}
      {editingCol && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1f1f1f] border border-[#3f3f3f] rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#272727] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Edit3 className="w-4 h-4 text-red-500" />
                <span>Edit Playlist Details</span>
              </h3>
              <button onClick={() => setEditingCol(null)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-gray-400">Playlist Title</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-[#121212] text-white border border-[#3f3f3f] px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-400">Description</label>
                <textarea
                  rows="3"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full bg-[#121212] text-white border border-[#3f3f3f] px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-red-500 resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCol(null)}
                  className="px-4 py-2 text-xs text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-semibold"
                >
                  Update Playlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HORIZONTAL SECTIONS OF PLAYLISTS (Requirements 1, 2 & 3) */}
      <div className="space-y-8">
        {collectionsData.length === 0 ? (
          <div className="bg-[#1f1f1f] border border-[#272727] rounded-2xl p-10 text-center text-gray-400 space-y-3">
            <FolderHeart className="w-10 h-10 text-gray-600 mx-auto" />
            <p className="text-sm font-semibold">No playlists created yet.</p>
            <p className="text-xs text-gray-500">Create your first playlist to organize videos into horizontal rows!</p>
          </div>
        ) : (
          collectionsData.map((col) => (
            <div key={col.id} className="space-y-3 bg-[#161616]/60 border border-[#272727] rounded-2xl p-4 transition-all">
              {/* Row Header & YouTube-Style Scroll Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <FolderHeart className="w-5 h-5 text-red-500" />
                  <h2 
                    onClick={() => onSelectCollection && onSelectCollection(col)}
                    className="text-base font-bold text-white hover:text-red-400 cursor-pointer transition-colors"
                  >
                    {col.name}
                  </h2>
                  <span className="bg-[#272727] text-gray-300 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-[#3f3f3f]">
                    {col.videoCount} videos
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => scrollRow(col.id, 'left')}
                    className="p-1.5 bg-[#222] hover:bg-[#333] border border-[#333] text-gray-300 hover:text-white rounded-full transition-colors"
                    title="Scroll left"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => scrollRow(col.id, 'right')}
                    className="p-1.5 bg-[#222] hover:bg-[#333] border border-[#333] text-gray-300 hover:text-white rounded-full transition-colors"
                    title="Scroll right"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Horizontal Scroll Panel */}
              <div 
                id={`playlist-scroll-${col.id}`}
                className="flex space-x-4 overflow-x-auto py-2 scroll-smooth scrollbar-none cursor-grab active:cursor-grabbing"
              >
                {/* 1st ITEM: UNIQUE 3D STACKED PLAYLIST BOX (Requirement 1 & 2) */}
                <div
                  onClick={() => onSelectCollection && onSelectCollection(col)}
                  className="relative pt-2 shrink-0 group w-60 cursor-pointer select-none"
                  title={`Open ${col.name} Playlist Page`}
                >
                  {/* 3D Stack Back Layer 2 */}
                  <div className="absolute top-0 left-4 right-4 h-3 rounded-t-xl bg-[#3a1518] border-t border-x border-red-500/30 opacity-70 group-hover:-translate-y-1 transition-transform" />
                  
                  {/* 3D Stack Middle Layer 1 */}
                  <div className="absolute top-1 left-2 right-2 h-3 rounded-t-xl bg-[#541c21] border-t border-x border-red-500/50 opacity-90 group-hover:-translate-y-0.5 transition-transform" />

                  {/* Main Playlist Card */}
                  <div className="relative bg-gradient-to-b from-[#2d1215] via-[#1c1214] to-[#110e10] border-2 border-red-600/60 group-hover:border-red-500 rounded-xl overflow-hidden shadow-2xl shadow-red-950/50 group-hover:shadow-red-600/30 group-hover:scale-[1.01] transition-all flex flex-col justify-between min-h-[220px]">
                    {/* Glowing Top Gradient Accent Line */}
                    <div className="h-1 bg-gradient-to-r from-red-600 via-amber-500 to-rose-600 w-full" />

                    {/* Thumbnail Hero Mosaic Cover with Holographic Shimmer Sweep */}
                    <div className="relative aspect-video bg-[#0d0d0d] overflow-hidden w-full group/thumb">
                      {col.thumbnails.length > 0 ? (
                        <div className="grid grid-cols-2 w-full h-full group-hover:scale-105 transition-transform duration-700 ease-out">
                          {col.thumbnails.concat([null, null, null]).slice(0, 4).map((thumb, idx) => (
                            <div key={idx} className="bg-[#181818] border-r border-b border-[#272727] overflow-hidden">
                              {thumb ? (
                                <img src={thumb} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-700">
                                  <Video className="w-3.5 h-3.5" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-600 space-y-1">
                          <Folder className="w-8 h-8 text-red-500/60" />
                          <span className="text-[10px] text-gray-500">Empty Playlist</span>
                        </div>
                      )}

                      {/* Luminous Light Shimmer Beam */}
                      <div className="shimmer-line z-20" />

                      {/* Top Left Overlay Badge */}
                      <div className="absolute top-2 left-2 z-10">
                        <span className="bg-red-600/95 backdrop-blur-sm text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-widest shadow-md border border-red-500/40 flex items-center space-x-1">
                          <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
                          <span>PLAYLIST</span>
                        </span>
                      </div>

                      {/* Bottom Right Video Count Overlay Badge */}
                      <div className="absolute bottom-2 right-2 bg-black/85 backdrop-blur-md text-white text-[11px] font-bold px-2 py-0.5 rounded-lg flex items-center space-x-1 border border-white/10 shadow-xl z-10 group-hover:border-red-500/50 transition-colors">
                        <ListVideo className="w-3.5 h-3.5 text-red-500" />
                        <span>{col.videoCount} videos</span>
                      </div>
                    </div>

                    {/* Content Info Section */}
                    <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center space-x-1.5 min-w-0">
                          <ListVideo className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          <h3 className="text-xs font-bold text-white group-hover:text-red-400 transition-colors truncate">
                            {col.name}
                          </h3>
                        </div>

                        {col.description && (
                          <p className="text-[11px] text-gray-400 line-clamp-2 mt-1 leading-snug">
                            {col.description}
                          </p>
                        )}
                      </div>

                      {/* Sparkle Badge Footer */}
                      <div className="pt-2 border-t border-red-500/20 flex items-center justify-between">
                        <span className="bg-red-500/15 text-red-400 text-[9px] font-bold px-2 py-0.5 rounded-full border border-red-500/30 uppercase tracking-wider flex items-center space-x-1">
                          <Sparkles className="w-2.5 h-2.5 text-red-400" />
                          <span>PLAYLIST</span>
                        </span>
                        <span className="text-[10px] text-gray-400 group-hover:text-white transition-colors font-medium">
                          Open →
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* REST OF HORIZONTAL ITEMS: PLAYLIST VIDEOS (Requirement 1 - Newest Leftmost) */}
                {col.playlistVideos.length === 0 ? (
                  <div className="flex items-center justify-center p-4 bg-[#121212] border border-dashed border-[#3f3f3f] rounded-xl w-64 text-center text-xs text-gray-500">
                    No videos added to this playlist yet.
                  </div>
                ) : (
                  col.playlistVideos.map((video) => (
                    <div
                      key={video.id}
                      onClick={() => onSelectVideo(video)}
                      className="w-56 shrink-0 bg-[#1f1f1f] hover:bg-[#252525] border border-[#272727] hover:border-red-500/50 rounded-xl overflow-hidden cursor-pointer transition-all shadow-md group flex flex-col justify-between"
                    >
                      <div className="relative aspect-video bg-black overflow-hidden">
                        <img
                          src={video.thumbnail_path || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80'}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-gray-200 text-[10px] font-mono px-1.5 py-0.5 rounded">
                          {formatDuration(video.duration_sec)}
                        </span>
                      </div>

                      <div className="p-3 space-y-1 flex-1 flex flex-col justify-between">
                        <h4 className="text-xs font-semibold text-white group-hover:text-red-400 transition-colors line-clamp-2 leading-snug">
                          {video.title}
                        </h4>
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
                  ))
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* BOTTOM SECTION: UNCATEGORIZED VIDEOS MATRIX GRID (Requirement 5) */}
      <div className="space-y-4 pt-6 border-t border-[#272727]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Grid className="w-5 h-5 text-gray-400" />
              <span>Uncategorized Videos</span>
              <span className="bg-[#272727] text-gray-300 text-xs px-2 py-0.5 rounded-full font-mono">
                {uncategorizedVideos.length}
              </span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Standalone offline videos not assigned to any playlist.
            </p>
          </div>
        </div>

        {uncategorizedVideos.length === 0 ? (
          <div className="bg-[#161616] border border-[#272727] rounded-xl p-8 text-center text-xs text-gray-500">
            All videos are organized inside playlists!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {uncategorizedVideos.map((video) => (
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
                  <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-gray-200 text-[10px] font-mono px-1.5 py-0.5 rounded">
                    {formatDuration(video.duration_sec)}
                  </span>
                </div>

                <div className="p-3 space-y-1.5 flex-1 flex flex-col justify-between">
                  <h4 className="text-xs font-semibold text-white group-hover:text-red-400 transition-colors line-clamp-2 leading-snug">
                    {video.title}
                  </h4>
                  <div className="flex items-center justify-between text-[11px] text-gray-400">
                    <span className="truncate">{video.channel_name}</span>
                    {video.completion_percent > 0 && (
                      <span className="text-[10px] text-emerald-400 font-mono shrink-0 ml-1">
                        {Math.round(video.completion_percent)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
