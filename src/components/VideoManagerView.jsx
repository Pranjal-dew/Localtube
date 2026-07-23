import React, { useState } from 'react';
import { HardDrive, Plus, Edit2, Trash2, Play, ExternalLink, X, Save, Clock, Film, Sparkles, Youtube, Check } from 'lucide-react';
import { db } from '../services/db';

export default function VideoManagerView({ videos, onRefresh, onSelectVideo, onOpenDownload }) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [deletingVideoId, setDeletingVideoId] = useState(null);

  // New Video Form State
  const [newVideo, setNewVideo] = useState({
    title: '',
    channel_name: '',
    duration_sec: 180,
    file_path: '',
    thumbnail_path: ''
  });

  // Edit Video Form State
  const [editForm, setEditForm] = useState({
    title: '',
    channel_name: '',
    duration_sec: 0,
    file_path: '',
    thumbnail_path: ''
  });

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!newVideo.title.trim() || !newVideo.file_path.trim()) return;

    const id = `manual_${Date.now()}`;
    db.insertVideo({
      id,
      title: newVideo.title.trim(),
      channel_name: newVideo.channel_name.trim() || 'Local Import',
      duration_sec: parseInt(newVideo.duration_sec, 10) || 120,
      file_path: newVideo.file_path.trim(),
      thumbnail_path: newVideo.thumbnail_path.trim() || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      chapters: [{ title: 'Beginning', start_time: 0, end_time: parseInt(newVideo.duration_sec, 10) || 120 }],
      comments: []
    });

    setNewVideo({ title: '', channel_name: '', duration_sec: 180, file_path: '', thumbnail_path: '' });
    setIsCreateOpen(false);
    onRefresh();
  };

  const handleEditClick = (video) => {
    setEditingVideo(video);
    setEditForm({
      title: video.title,
      channel_name: video.channel_name,
      duration_sec: video.duration_sec,
      file_path: video.file_path,
      thumbnail_path: video.thumbnail_path
    });
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editingVideo || !editForm.title.trim()) return;

    db.updateVideo(editingVideo.id, {
      title: editForm.title.trim(),
      channel_name: editForm.channel_name.trim(),
      duration_sec: parseInt(editForm.duration_sec, 10) || 0,
      file_path: editForm.file_path.trim(),
      thumbnail_path: editForm.thumbnail_path.trim()
    });

    setEditingVideo(null);
    onRefresh();
  };

  const handleDeleteConfirm = () => {
    if (!deletingVideoId) return;
    db.deleteVideo(deletingVideoId);
    setDeletingVideoId(null);
    onRefresh();
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-[#272727] pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <HardDrive className="w-6 h-6 text-red-500" />
            <span>Video Manager</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Manage your offline video library. Edit metadata, delete recordings, or manually import local MP4 files.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="bg-[#1f1f1f] hover:bg-[#252525] border border-[#3f3f3f] text-gray-200 text-xs px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition-colors font-semibold"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Add Video Manually</span>
          </button>

          <button
            onClick={onOpenDownload}
            className="bg-red-600 hover:bg-red-700 text-white text-xs px-4 py-2 rounded-xl flex items-center space-x-1.5 font-semibold shadow-md shadow-red-600/20 active:scale-95 transition-all"
          >
            <Youtube className="w-4 h-4" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Videos List Table */}
      <div className="bg-[#1f1f1f] border border-[#272727] rounded-2xl overflow-hidden shadow-xl">
        {videos.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Film className="w-12 h-12 text-gray-600 mx-auto" />
            <p className="text-sm font-semibold text-gray-400">No videos in your local library.</p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="text-xs text-red-400 hover:underline font-semibold"
            >
              Add your first video manually or add a YouTube URL.
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#272727]">
            {videos.map((video) => (
              <div 
                key={video.id}
                className="p-4 flex items-center justify-between hover:bg-[#252525] transition-colors group"
              >
                {/* Video Info & Thumbnail */}
                <div className="flex items-center space-x-4 flex-1 min-w-0 pr-4">
                  <div 
                    onClick={() => onSelectVideo(video)}
                    className="relative w-28 h-16 rounded-lg overflow-hidden bg-black shrink-0 cursor-pointer group-hover:ring-2 ring-red-500 transition-all"
                  >
                    <img
                      src={video.thumbnail_path || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80'}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-6 h-6 text-white fill-current" />
                    </div>
                    <span className="absolute bottom-1 right-1 bg-black/80 text-[10px] text-gray-300 font-mono px-1 rounded">
                      {formatDuration(video.duration_sec)}
                    </span>
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <h3 
                      onClick={() => onSelectVideo(video)}
                      className="text-sm font-bold text-white truncate cursor-pointer hover:text-red-400 transition-colors"
                    >
                      {video.title}
                    </h3>
                    <div className="flex items-center space-x-3 text-xs text-gray-400">
                      <span>{video.channel_name}</span>
                      <span>•</span>
                      <span className="font-mono text-[11px] text-emerald-400">
                        {video.completion_percent ? `${video.completion_percent}% watched` : 'Unwatched'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onSelectVideo(video)}
                    className="bg-[#121212] hover:bg-[#272727] text-gray-300 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 border border-[#3f3f3f] transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 text-red-500 fill-current" />
                    <span>Play</span>
                  </button>

                  <button
                    onClick={() => handleEditClick(video)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-[#272727] rounded-lg transition-colors"
                    title="Edit Metadata"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setDeletingVideoId(video.id)}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-[#272727] rounded-lg transition-colors"
                    title="Delete Video"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE MANUAL VIDEO MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#1f1f1f] border border-[#272727] w-full max-w-lg rounded-2xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#272727] pb-3">
              <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Add Video to Local Library</span>
              </h2>
              <button onClick={() => setIsCreateOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Video Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. My Offline Recording"
                  value={newVideo.title}
                  onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                  className="w-full bg-[#121212] text-white border border-[#3f3f3f] px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Channel / Uploader</label>
                  <input
                    type="text"
                    placeholder="e.g. Personal Studio"
                    value={newVideo.channel_name}
                    onChange={(e) => setNewVideo({ ...newVideo, channel_name: e.target.value })}
                    className="w-full bg-[#121212] text-white border border-[#3f3f3f] px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Duration (Seconds)</label>
                  <input
                    type="number"
                    value={newVideo.duration_sec}
                    onChange={(e) => setNewVideo({ ...newVideo, duration_sec: e.target.value })}
                    className="w-full bg-[#121212] text-white border border-[#3f3f3f] px-3 py-2 rounded-xl text-xs font-mono focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">File Path / Stream URL *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. http://localhost:3001/media/sample.mp4"
                  value={newVideo.file_path}
                  onChange={(e) => setNewVideo({ ...newVideo, file_path: e.target.value })}
                  className="w-full bg-[#121212] text-white border border-[#3f3f3f] px-3 py-2 rounded-xl text-xs font-mono focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Thumbnail Image URL</label>
                <input
                  type="text"
                  placeholder="Optional thumbnail link"
                  value={newVideo.thumbnail_path}
                  onChange={(e) => setNewVideo({ ...newVideo, thumbnail_path: e.target.value })}
                  className="w-full bg-[#121212] text-white border border-[#3f3f3f] px-3 py-2 rounded-xl text-xs font-mono focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="bg-[#121212] text-gray-400 hover:text-white px-4 py-2 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-md transition-all"
                >
                  Save & Insert Video
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT VIDEO METADATA MODAL */}
      {editingVideo && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#1f1f1f] border border-[#272727] w-full max-w-lg rounded-2xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#272727] pb-3">
              <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                <Edit2 className="w-4 h-4 text-red-500" />
                <span>Edit Video Metadata</span>
              </h2>
              <button onClick={() => setEditingVideo(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Title</label>
                <input
                  type="text"
                  required
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full bg-[#121212] text-white border border-[#3f3f3f] px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Channel / Author</label>
                  <input
                    type="text"
                    value={editForm.channel_name}
                    onChange={(e) => setEditForm({ ...editForm, channel_name: e.target.value })}
                    className="w-full bg-[#121212] text-white border border-[#3f3f3f] px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Duration (Sec)</label>
                  <input
                    type="number"
                    value={editForm.duration_sec}
                    onChange={(e) => setEditForm({ ...editForm, duration_sec: e.target.value })}
                    className="w-full bg-[#121212] text-white border border-[#3f3f3f] px-3 py-2 rounded-xl text-xs font-mono focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Video Source File Path</label>
                <input
                  type="text"
                  value={editForm.file_path}
                  onChange={(e) => setEditForm({ ...editForm, file_path: e.target.value })}
                  className="w-full bg-[#121212] text-white border border-[#3f3f3f] px-3 py-2 rounded-xl text-xs font-mono focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Thumbnail URL</label>
                <input
                  type="text"
                  value={editForm.thumbnail_path}
                  onChange={(e) => setEditForm({ ...editForm, thumbnail_path: e.target.value })}
                  className="w-full bg-[#121212] text-white border border-[#3f3f3f] px-3 py-2 rounded-xl text-xs font-mono focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingVideo(null)}
                  className="bg-[#121212] text-gray-400 hover:text-white px-4 py-2 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-md transition-all flex items-center space-x-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Update Video</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingVideoId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#1f1f1f] border border-[#272727] w-full max-w-sm rounded-2xl p-6 space-y-4 shadow-2xl text-center">
            <Trash2 className="w-10 h-10 text-red-500 mx-auto animate-bounce" />
            <div>
              <h3 className="text-sm font-bold text-white">Delete Video Record?</h3>
              <p className="text-xs text-gray-400 mt-1">
                This will remove the video record and its associated comments from your database.
              </p>
            </div>
            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                onClick={() => setDeletingVideoId(null)}
                className="bg-[#121212] text-gray-300 hover:text-white px-4 py-2 rounded-xl text-xs font-semibold border border-[#3f3f3f]"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
