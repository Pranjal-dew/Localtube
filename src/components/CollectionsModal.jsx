import React, { useState, useEffect } from 'react';
import { FolderHeart, Plus, X, Folder, Trash2, Play } from 'lucide-react';
import { db } from '../services/db';

export default function CollectionsModal({ isOpen, onClose, onSelectVideo }) {
  const [collections, setCollections] = useState([]);
  const [selectedCol, setSelectedCol] = useState(null);
  const [colItems, setColItems] = useState([]);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadCollections();
    }
  }, [isOpen]);

  const loadCollections = () => {
    const cols = db.getCollections();
    setCollections(cols);
    if (cols.length > 0 && !selectedCol) {
      selectCollection(cols[0]);
    }
  };

  const selectCollection = (col) => {
    setSelectedCol(col);
    const items = db.getCollectionItems(col.id);
    setColItems(items);
  };

  const handleCreateCollection = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const created = db.createCollection(newName.trim(), newDesc.trim());
    setNewName('');
    setNewDesc('');
    loadCollections();
    selectCollection(created);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-popover">
      <div className="bg-[#1f1f1f] border border-[#3f3f3f] rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col h-[520px]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#272727] flex items-center justify-between bg-[#121212]">
          <div className="flex items-center space-x-2">
            <FolderHeart className="w-5 h-5 text-red-500" />
            <h2 className="text-base font-bold text-white tracking-tight">Custom Collections & Playlists</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Split View */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar: Collection List & Form */}
          <div className="w-64 border-r border-[#272727] bg-[#171717] p-3 flex flex-col space-y-3">
            <form onSubmit={handleCreateCollection} className="space-y-2 pb-3 border-b border-[#272727]">
              <input
                type="text"
                required
                placeholder="Playlist Name..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-[#121212] text-white border border-[#3f3f3f] p-2 rounded-lg text-xs focus:outline-none focus:border-red-500"
              />
              <button
                type="submit"
                className="w-full bg-[#272727] hover:bg-[#3f3f3f] text-white text-xs font-semibold py-1.5 rounded-lg flex items-center justify-center space-x-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Collection</span>
              </button>
            </form>

            <div className="flex-1 overflow-y-auto space-y-1">
              {collections.map((col) => (
                <button
                  key={col.id}
                  onClick={() => selectCollection(col)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center space-x-2 transition-all ${
                    selectedCol?.id === col.id
                      ? 'bg-red-600 text-white font-semibold shadow-md shadow-red-600/20'
                      : 'text-gray-300 hover:bg-[#252525]'
                  }`}
                >
                  <Folder className="w-4 h-4 shrink-0" />
                  <span className="truncate">{col.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right Area: Collection Videos */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {selectedCol ? (
              <div>
                <div className="mb-3">
                  <h3 className="text-sm font-bold text-white">{selectedCol.name}</h3>
                  <p className="text-xs text-gray-400">{selectedCol.description || 'No description provided'}</p>
                </div>

                {colItems.length === 0 ? (
                  <div className="text-center py-16 text-gray-500 text-xs">
                    This collection is empty. Add videos from your library feed!
                  </div>
                ) : (
                  <div className="space-y-2">
                    {colItems.map(({ video }) => (
                      <div
                        key={video.id}
                        onClick={() => {
                          onSelectVideo(video);
                          onClose();
                        }}
                        className="bg-[#121212] hover:bg-[#252525] p-2.5 rounded-xl border border-[#272727] flex items-center justify-between cursor-pointer transition-all group"
                      >
                        <div className="flex items-center space-x-3">
                          <img
                            src={video.thumbnail_path}
                            alt=""
                            className="w-16 aspect-video object-cover rounded-lg border border-[#3f3f3f]"
                          />
                          <div>
                            <h4 className="text-xs font-semibold text-white group-hover:text-red-400 transition-colors">
                              {video.title}
                            </h4>
                            <p className="text-[10px] text-gray-400">{video.channel_name}</p>
                          </div>
                        </div>

                        <div className="bg-red-600/20 text-red-500 p-2 rounded-full group-hover:scale-110 transition-transform">
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-20 text-gray-500 text-xs">
                Select a collection from the sidebar
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
