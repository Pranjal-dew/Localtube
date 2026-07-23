import React, { useState, useEffect } from 'react';
import { Trash2, RotateCcw, Video, RefreshCw, AlertTriangle } from 'lucide-react';
import { db } from '../services/db';

export default function BinView({ onRefresh, onSelectVideo }) {
  const [deletedNotes, setDeletedNotes] = useState([]);

  useEffect(() => {
    loadDeletedNotes();
  }, []);

  const loadDeletedNotes = () => {
    const deleted = db.getDeletedNotes();
    setDeletedNotes(deleted);
  };

  const handleRestoreNote = (id) => {
    db.restoreComment(id);
    loadDeletedNotes();
    if (onRefresh) onRefresh();
  };

  const handlePermanentDelete = (id) => {
    db.permanentlyDeleteComment(id);
    loadDeletedNotes();
  };

  const handleEmptyBin = () => {
    db.emptyDeletedNotesBin();
    loadDeletedNotes();
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#272727] pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2.5">
            <Trash2 className="w-6 h-6 text-yellow-400" />
            <span>Recycle Bin & Deleted Notes</span>
            <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2.5 py-0.5 rounded-full font-mono font-bold border border-yellow-500/30">
              {deletedNotes.length}
            </span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Review, restore, or permanently purge local notes deleted from your videos.
          </p>
        </div>

        {deletedNotes.length > 0 && (
          <button
            type="button"
            onClick={handleEmptyBin}
            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 text-xs px-3 py-1.5 rounded-xl transition-all font-semibold flex items-center space-x-1.5 shadow-sm active:scale-95"
          >
            <Trash2 className="w-4 h-4" />
            <span>Empty Recovery Bin</span>
          </button>
        )}
      </div>

      {/* Feed List */}
      {deletedNotes.length === 0 ? (
        <div className="bg-[#1f1f1f] border border-[#272727] rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-yellow-500/10 text-yellow-400 rounded-full flex items-center justify-center mx-auto border border-yellow-500/20">
            <Trash2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-gray-200">Recycle Bin is Empty</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            When you delete local personal notes from any video, they will be safely backed up here so you can restore them anytime.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {deletedNotes.map(note => (
            <div 
              key={note.id} 
              className="bg-[#1f1f1f] hover:bg-[#252525] border border-[#272727] hover:border-[#3f3f3f] p-4 rounded-2xl transition-all shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 group"
            >
              <div className="space-y-2 min-w-0 flex-1">
                {/* Meta Header */}
                <div className="flex items-center space-x-2 text-xs flex-wrap gap-y-1">
                  {note.video ? (
                    <button
                      onClick={() => onSelectVideo && onSelectVideo(note.video)}
                      className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 text-[11px] px-2.5 py-1 rounded-lg font-semibold flex items-center space-x-1.5 border border-yellow-500/30 transition-colors"
                      title="Jump to video"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[240px]">{note.video.title}</span>
                    </button>
                  ) : (
                    <span className="bg-gray-800 text-gray-400 text-[11px] px-2 py-0.5 rounded">
                      Video #{note.video_id}
                    </span>
                  )}

                  <span className="text-[11px] text-gray-500">
                    Deleted on {formatDateTime(note.deleted_at)}
                  </span>
                </div>

                {/* Note Content */}
                <p className="text-xs text-gray-200 leading-relaxed whitespace-pre-wrap font-sans bg-[#121212] p-3 rounded-xl border border-[#272727]">
                  {note.content}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 shrink-0 self-end md:self-center">
                <button
                  type="button"
                  onClick={() => handleRestoreNote(note.id)}
                  className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-xs px-3 py-1.5 rounded-xl font-semibold flex items-center space-x-1.5 transition-all shadow-sm active:scale-95"
                  title="Restore note to video"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore Note</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePermanentDelete(note.id)}
                  className="bg-[#121212] hover:bg-red-500/20 text-gray-400 hover:text-red-400 border border-[#272727] hover:border-red-500/30 text-xs px-3 py-1.5 rounded-xl font-semibold flex items-center space-x-1.5 transition-all active:scale-95"
                  title="Permanently delete note"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Permanently</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
