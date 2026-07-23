import React, { useState, useEffect } from 'react';
import { FolderHeart, Folder, Plus, Play, Trash2, Video, Edit3, X, Check, Settings } from 'lucide-react';
import { db } from '../services/db';

export default function CollectionsView({ onSelectVideo, onSelectCollection }) {
  const [collections, setCollections] = useState([]);
  const [collectionsData, setCollectionsData] = useState([]);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Edit Collection State
  const [editingCol, setEditingCol] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  useEffect(() => {
    loadCollectionsData();
  }, []);

  const loadCollectionsData = () => {
    const cols = db.getCollections();
    setCollections(cols);

    // Build enriched collections with items and thumbnails
    const data = cols.map((col) => {
      const items = db.getCollectionItems(col.id);
      return {
        ...col,
        items,
        videoCount: items.length,
        thumbnails: items.slice(0, 4).map(i => i.video?.thumbnail_path).filter(Boolean)
      };
    });
    setCollectionsData(data);
  };

  const handleCreateCollection = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;

    db.createCollection(newName.trim(), newDesc.trim());
    setNewName('');
    setNewDesc('');
    setShowCreateForm(false);
    loadCollectionsData();
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
    loadCollectionsData();
  };

  const handleDeleteCollection = (e, colId) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this collection?")) {
      db.deleteCollection(colId);
      loadCollectionsData();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#272727] pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <FolderHeart className="w-6 h-6 text-red-500" />
            <span>Collections & Playlists</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Manage, edit, and organize your local YouTube videos into custom topic playlists.
          </p>
        </div>

        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center space-x-2 shadow-lg shadow-red-600/20 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Collection</span>
        </button>
      </div>

      {/* Create Collection Inline Form */}
      {showCreateForm && (
        <form onSubmit={handleCreateCollection} className="bg-[#1f1f1f] border border-[#3f3f3f] p-4 rounded-2xl space-y-3">
          <h3 className="text-sm font-bold text-white">Create New Collection</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              required
              placeholder="Collection Title (e.g. AI Tutorials, Music Videos)..."
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
              Save Collection
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
                <span>Edit Collection Details</span>
              </h3>
              <button onClick={() => setEditingCol(null)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-gray-400">Collection Title</label>
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
                  Update Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Collections YouTube-style Grid */}
      {collectionsData.length === 0 ? (
        <div className="bg-[#1f1f1f] border border-[#272727] rounded-2xl p-12 text-center text-gray-400 space-y-3">
          <FolderHeart className="w-12 h-12 text-gray-600 mx-auto" />
          <p className="text-sm font-semibold">No collections created yet.</p>
          <p className="text-xs text-gray-500">Create your first playlist collection to group downloaded videos!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {collectionsData.map((col) => (
            <div
              key={col.id}
              onClick={() => onSelectCollection && onSelectCollection(col)}
              className="bg-[#1f1f1f] hover:bg-[#252525] border border-[#272727] hover:border-[#3f3f3f] rounded-2xl overflow-hidden cursor-pointer transition-all shadow-lg group flex flex-col justify-between"
            >
              {/* Thumbnail Mosaic / Banner */}
              <div className="relative aspect-video bg-[#121212] overflow-hidden">
                {col.thumbnails.length > 0 ? (
                  <div className="grid grid-cols-2 w-full h-full">
                    {col.thumbnails.concat([null, null, null]).slice(0, 4).map((thumb, idx) => (
                      <div key={idx} className="bg-[#181818] border-r border-b border-[#272727] overflow-hidden">
                        {thumb ? (
                          <img src={thumb} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-700">
                            <Video className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-600 space-y-1">
                    <Folder className="w-10 h-10" />
                    <span className="text-[10px]">Empty Collection</span>
                  </div>
                )}

                {/* Video Count Overlay Badge */}
                <div className="absolute bottom-2 right-2 bg-black/85 backdrop-blur-sm text-white text-[11px] font-semibold px-2 py-0.5 rounded-lg flex items-center space-x-1 border border-white/10">
                  <Video className="w-3 h-3 text-red-500" />
                  <span>{col.videoCount} videos</span>
                </div>
              </div>

              {/* Info & Edit Controls */}
              <div className="p-4 space-y-1.5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-red-400 transition-colors">
                      {col.name}
                    </h3>
                    
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => handleStartEdit(e, col)}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white p-1 transition-opacity"
                        title="Edit collection info"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteCollection(e, col.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 p-1 transition-opacity"
                        title="Delete collection"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {col.description && (
                    <p className="text-xs text-gray-400 line-clamp-2 mt-0.5">{col.description}</p>
                  )}
                </div>

                {col.items.length > 0 && (
                  <div className="pt-2 border-t border-[#272727] flex items-center justify-between text-[11px] text-gray-400">
                    <span className="truncate">First video: {col.items[0].video?.title}</span>
                    <Play className="w-3.5 h-3.5 text-red-500 fill-current shrink-0 ml-2" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

