import React, { useState } from 'react';
import { ListVideo, FolderArchive, Plus, Edit2, Trash2, Play, Info, AlertCircle, Sparkles, FolderPlus, Film, Check, ChevronRight, X } from 'lucide-react';
import { db } from '../services/db';

export default function PlaylistsManagerView({ onSelectVideo, onRefresh }) {
  const [activeSubTab, setActiveSubTab] = useState('playlists'); // 'playlists' | 'collections_todo'

  // Modals & State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');

  const [editingPlaylist, setEditingPlaylist] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);

  // Fetch Data
  const collections = db.getCollections(); // Playlists in DB
  const videos = db.getVideos();
  const allCollectionItems = JSON.parse(localStorage.getItem('localtube_collection_items_v1') || '[]');

  // Determine videos categorized in NO playlist
  const categorizedVideoIds = new Set(allCollectionItems.map(i => i.video_id));
  const uncategorizedVideos = videos.filter(v => !categorizedVideoIds.has(v.id));

  const handleCreatePlaylist = (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    db.createCollection(newPlaylistName.trim(), newPlaylistDesc.trim());
    setNewPlaylistName('');
    setNewPlaylistDesc('');
    setIsCreateOpen(false);
    if (onRefresh) onRefresh();
  };

  const handleUpdatePlaylist = (e) => {
    e.preventDefault();
    if (!editingPlaylist || !editName.trim()) return;
    db.updateCollection(editingPlaylist.id, editName.trim(), editDesc.trim());
    setEditingPlaylist(null);
    if (onRefresh) onRefresh();
  };

  const handleDeletePlaylist = (id) => {
    db.deleteCollection(id);
    if (selectedPlaylistId === id) setSelectedPlaylistId(null);
    if (onRefresh) onRefresh();
  };

  const handleToggleVideoInPlaylist = (playlistId, videoId) => {
    const isAlreadyIn = allCollectionItems.some(i => i.collection_id === playlistId && i.video_id === videoId);
    if (isAlreadyIn) {
      db.removeVideoFromCollection(playlistId, videoId);
    } else {
      db.addVideoToCollection(playlistId, videoId);
    }
    if (onRefresh) onRefresh();
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header & Architecture Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#272727] pb-4 gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <ListVideo className="w-6 h-6 text-red-500" />
            <span>Playlists & Collections Manager</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Organize videos into database playlists or preview physical folder collection management.
          </p>
        </div>

        {/* Sub-Tab Navigation Bar */}
        <div className="flex items-center space-x-2 bg-[#121212] p-1.5 rounded-xl border border-[#272727]">
          <button
            onClick={() => setActiveSubTab('playlists')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center space-x-1.5 ${
              activeSubTab === 'playlists'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <ListVideo className="w-4 h-4" />
            <span>Database Playlists</span>
          </button>

          <button
            onClick={() => setActiveSubTab('collections_todo')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center space-x-1.5 ${
              activeSubTab === 'collections_todo'
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <FolderArchive className="w-4 h-4 text-yellow-400" />
            <span>File Collections (TODO)</span>
          </button>
        </div>
      </div>

      {/* SUB TAB 1: DATABASE PLAYLISTS */}
      {activeSubTab === 'playlists' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Categorize videos independently of their physical storage locations into database playlists.
            </p>

            <button
              onClick={() => setIsCreateOpen(true)}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center space-x-1.5 shadow-md shadow-red-600/20 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Playlist</span>
            </button>
          </div>

          {/* Grid Layout: Left Playlists List, Right Uncategorized Default Category */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Playlists Cards Column */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Your Playlists</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {collections.map((playlist) => {
                  const items = db.getCollectionItems(playlist.id);
                  const isSelected = selectedPlaylistId === playlist.id;

                  return (
                    <div 
                      key={playlist.id}
                      className={`bg-[#1f1f1f] p-4 rounded-2xl border transition-all space-y-3 ${
                        isSelected ? 'border-red-500 ring-1 ring-red-500' : 'border-[#272727] hover:border-[#3f3f3f]'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-white leading-snug">{playlist.name}</h3>
                          <p className="text-[11px] text-gray-400 line-clamp-1">{playlist.description || 'No description'}</p>
                        </div>

                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => {
                              setEditingPlaylist(playlist);
                              setEditName(playlist.name);
                              setEditDesc(playlist.description);
                            }}
                            className="p-1 text-gray-400 hover:text-white"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeletePlaylist(playlist.id)}
                            className="p-1 text-gray-400 hover:text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-400 border-t border-[#272727] pt-2.5">
                        <span className="font-mono text-emerald-400 font-semibold">{items.length} Videos</span>
                        <button
                          onClick={() => setSelectedPlaylistId(isSelected ? null : playlist.id)}
                          className="text-red-400 hover:underline font-semibold flex items-center space-x-1"
                        >
                          <span>{isSelected ? 'Hide Videos' : 'Manage Playlist'}</span>
                          <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                        </button>
                      </div>

                      {/* Expandable Video List for Playlist */}
                      {isSelected && (
                        <div className="pt-2 space-y-2 border-t border-[#272727]">
                          <span className="text-[10px] font-bold text-gray-400 uppercase">Videos in Playlist:</span>
                          {items.length === 0 ? (
                            <p className="text-[11px] text-gray-500">No videos assigned yet.</p>
                          ) : (
                            items.map(item => (
                              <div key={item.video_id} className="flex items-center justify-between bg-[#121212] p-2 rounded-lg text-xs">
                                <span className="text-gray-200 truncate flex-1 pr-2">{item.video.title}</span>
                                <button
                                  onClick={() => db.removeVideoFromCollection(playlist.id, item.video_id)}
                                  className="text-gray-500 hover:text-red-400 text-[10px] font-semibold"
                                >
                                  Remove
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Default Category: Videos Not in Any Playlist */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-[#191919] border border-yellow-500/30 p-4 rounded-2xl space-y-3">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0" />
                  <div>
                    <h3 className="text-xs font-bold text-yellow-400">Uncategorized Videos</h3>
                    <p className="text-[10px] text-gray-400">Videos not assigned to any playlist</p>
                  </div>
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {uncategorizedVideos.length === 0 ? (
                    <div className="text-center py-6 text-xs text-gray-500">
                      ✨ Great job! All videos are assigned to at least one playlist.
                    </div>
                  ) : (
                    uncategorizedVideos.map((video) => (
                      <div key={video.id} className="bg-[#121212] p-2.5 rounded-xl border border-[#272727] space-y-1.5">
                        <p className="text-xs font-semibold text-gray-200 truncate">{video.title}</p>
                        <p className="text-[10px] text-gray-500">{video.channel_name}</p>

                        {/* Quick Add Dropdown */}
                        <div className="pt-1 flex items-center justify-between">
                          <span className="text-[10px] text-yellow-400/80 font-mono">Not in any playlist</span>
                          {collections.length > 0 && (
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  db.addVideoToCollection(parseInt(e.target.value, 10), video.id);
                                  if (onRefresh) onRefresh();
                                }
                              }}
                              className="bg-[#1f1f1f] text-gray-300 text-[10px] px-2 py-1 rounded border border-[#3f3f3f] focus:outline-none"
                              defaultValue=""
                            >
                              <option value="" disabled>Add to Playlist...</option>
                              {collections.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB TAB 2: FILE COLLECTIONS (FUTURE ARCHITECTURE / TODO SPEC) */}
      {activeSubTab === 'collections_todo' && (
        <div className="bg-[#1f1f1f] border border-yellow-500/30 p-8 rounded-2xl space-y-6">
          <div className="flex items-center space-x-3 border-b border-[#272727] pb-4">
            <FolderArchive className="w-8 h-8 text-yellow-400 shrink-0" />
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white">Physical File Collections (Disk Management)</h2>
                <span className="bg-yellow-500/20 text-yellow-400 text-[10px] font-bold px-2 py-0.5 rounded border border-yellow-500/30">
                  TODO / PLANNED
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Future feature specification for managing local filesystem directories on Zorin OS.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed text-gray-300">
            <div className="bg-[#121212] p-5 rounded-xl border border-[#272727] space-y-3">
              <h3 className="text-sm font-bold text-yellow-400 flex items-center space-x-1.5">
                <Info className="w-4 h-4" />
                <span>Difference: Playlists vs. Collections</span>
              </h3>
              <ul className="space-y-2 text-gray-300 list-disc list-inside">
                <li>
                  <strong className="text-white">Database Playlists (Current):</strong> Logical groupings in SQLite metadata. A single video file can belong to multiple playlists without duplicating disk storage.
                </li>
                <li>
                  <strong className="text-white">Physical File Collections (Future TODO):</strong> Directly manages OS filesystem folders (e.g. <code className="text-yellow-400 font-mono">~/Videos/Blender_Render_Collection/</code>). Moving a video between collections physically re-locates `.mp4` and `.info.json` files on disk.
                </li>
              </ul>
            </div>

            <div className="bg-[#121212] p-5 rounded-xl border border-[#272727] space-y-3">
              <h3 className="text-sm font-bold text-emerald-400 flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4" />
                <span>Planned Roadmap Capabilities</span>
              </h3>
              <ul className="space-y-2 text-gray-300 list-disc list-inside">
                <li>Automatic subfolder creation when downloading custom playlists from YouTube.</li>
                <li>Local file watcher syncing offline USB drives with LocalTube library.</li>
                <li>Batch export of offline collections to external hard drives with metadata.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* CREATE PLAYLIST MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1f1f1f] border border-[#272727] w-full max-w-md rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#272727] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Plus className="w-4 h-4 text-red-500" />
                <span>Create New Playlist</span>
              </h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePlaylist} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Playlist Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CGI Benchmarks"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="w-full bg-[#121212] text-white border border-[#3f3f3f] px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Description</label>
                <textarea
                  rows="2"
                  placeholder="Optional notes about this playlist"
                  value={newPlaylistDesc}
                  onChange={(e) => setNewPlaylistDesc(e.target.value)}
                  className="w-full bg-[#121212] text-white border border-[#3f3f3f] px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-red-500 resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="bg-[#121212] text-gray-400 hover:text-white px-3 py-1.5 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg text-xs font-semibold"
                >
                  Create Playlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PLAYLIST MODAL */}
      {editingPlaylist && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1f1f1f] border border-[#272727] w-full max-w-md rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#272727] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Edit2 className="w-4 h-4 text-red-500" />
                <span>Edit Playlist</span>
              </h3>
              <button onClick={() => setEditingPlaylist(null)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdatePlaylist} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Playlist Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-[#121212] text-white border border-[#3f3f3f] px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Description</label>
                <textarea
                  rows="2"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full bg-[#121212] text-white border border-[#3f3f3f] px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-red-500 resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPlaylist(null)}
                  className="bg-[#121212] text-gray-400 hover:text-white px-3 py-1.5 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg text-xs font-semibold"
                >
                  Update Playlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
