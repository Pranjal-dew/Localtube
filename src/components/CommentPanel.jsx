import React, { useState } from 'react';
import { MessageSquare, FileText, Plus, Trash2, Clock, Send, Sparkles, ThumbsUp, CornerDownRight, ChevronDown, ChevronUp, RefreshCw, ArrowUpDown } from 'lucide-react';
import { db } from '../services/db';

export default function CommentPanel({ 
  video, 
  comments, 
  onRefreshComments, 
  onSeek, 
  quickNoteTimestamp,
  clearQuickNoteTimestamp 
}) {
  const [activeTab, setActiveTab] = useState('notes'); // 'notes' | 'public'
  const [noteContent, setNoteContent] = useState('');
  const [customTimestamp, setCustomTimestamp] = useState('');

  // Pre-fill quick note timestamp if triggered from player
  React.useEffect(() => {
    if (quickNoteTimestamp !== null && quickNoteTimestamp !== undefined) {
      setCustomTimestamp(Math.floor(quickNoteTimestamp).toString());
      setActiveTab('notes');
    }
  }, [quickNoteTimestamp]);

  const publicComments = comments.filter(c => c.is_local === 0);
  const localNotes = comments.filter(c => c.is_local === 1);

  // Render comment text with inline clickable timestamp link (e.g. 0:31)
  const renderCommentWithInlineLinks = (text, isLocal, commentTimestamp) => {
    if (!text) return null;

    // Filter out leading 0:00
    const clean = text.replace(/^(?:0?:00\s*\n?|\n?0?:00\s*)/gi, '').trim();
    if (!clean) return null;

    const regex = /\b(?:(\d+):)?([0-5]?\d):([0-5]\d)\b/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(clean)) !== null) {
      const matchText = match[0];
      const matchIndex = match.index;

      let sec = 0;
      if (match[1]) {
        sec = parseInt(match[1], 10) * 3600 + parseInt(match[2], 10) * 60 + parseInt(match[3], 10);
      } else {
        sec = parseInt(match[2], 10) * 60 + parseInt(match[3], 10);
      }

      // Ignore 0:00 timestamps
      if (sec === 0) continue;

      if (matchIndex > lastIndex) {
        parts.push(clean.substring(lastIndex, matchIndex));
      }

      parts.push(
        <button
          key={matchIndex}
          onClick={(e) => {
            e.stopPropagation();
            onSeek(sec);
          }}
          className={`font-mono font-bold hover:underline px-1 py-0.5 rounded text-[11px] transition-colors ${
            isLocal
              ? 'text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20'
              : 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
          }`}
          title={`Seek to ${matchText}`}
        >
          {matchText}
        </button>
      );

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < clean.length) {
      parts.push(clean.substring(lastIndex));
    }

    return parts.length > 0 ? parts : clean;
  };

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!noteContent.trim() || !video) return;

    const timeSec = customTimestamp !== '' ? parseInt(customTimestamp, 10) : 0;

    db.insertComment({
      video_id: video.id,
      author: "Me",
      content: noteContent.trim(),
      timestamp_sec: timeSec,
      is_local: 1
    });

    setNoteContent('');
    setCustomTimestamp('');
    if (clearQuickNoteTimestamp) clearQuickNoteTimestamp();
    onRefreshComments();
  };

  const handleDelete = (id) => {
    db.deleteComment(id);
    onRefreshComments();
  };

  const [sortBy, setSortBy] = useState('likes'); // 'likes' | 'time'

  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncComments = async () => {
    if (!video || isSyncing) return;
    setIsSyncing(true);
    try {
      const settings = db.getSettings();
      const res = await fetch('http://localhost:3001/api/comments/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: video.id,
          youtubeUrl: video.youtube_url,
          settings
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.comments) {
          db.replacePublicComments(video.id, data.comments);
          onRefreshComments();
        }
      }
    } catch (err) {
      console.warn('[CommentPanel] Failed to sync comments from server:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="bg-[#1f1f1f] rounded-2xl border border-[#272727] flex flex-col h-[560px] overflow-hidden shadow-xl">
      {/* Dual-Layer Tab Header */}
      <div className="flex items-center border-b border-[#272727] bg-[#121212] p-1.5 space-x-1">
        <button
          onClick={() => setActiveTab('public')}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center space-x-2 ${
            activeTab === 'public'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-emerald-400" />
          <span>YouTube Comments ({publicComments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('notes')}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center space-x-2 ${
            activeTab === 'notes'
              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 shadow-sm'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <FileText className="w-4 h-4 text-yellow-400" />
          <span>Local Notes ({localNotes.length})</span>
        </button>
      </div>

      {/* Tab Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* PUBLIC YOUTUBE COMMENTS TAB (GREEN THEME) WITH LIKES & THREADED SUB-COMMENTS */}
        {activeTab === 'public' && (
          <div className="space-y-3">
            {/* Sync & Sort Action Bar */}
            <div className="flex items-center justify-between bg-[#121212] px-3 py-2 rounded-xl border border-emerald-500/20">
              <div className="flex items-center space-x-1.5 text-xs text-gray-300">
                <ArrowUpDown className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] text-gray-400">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-[#1f1f1f] text-emerald-400 font-semibold border border-emerald-500/30 text-[11px] rounded-lg px-2 py-0.5 focus:outline-none cursor-pointer"
                >
                  <option value="likes">Top Liked (Default)</option>
                  <option value="time">Timestamp Order</option>
                </select>
              </div>

              <button
                onClick={handleSyncComments}
                disabled={isSyncing || !video}
                className="bg-emerald-500/20 hover:bg-emerald-500/30 disabled:opacity-50 text-emerald-400 border border-emerald-500/30 text-xs px-2.5 py-1 rounded-lg flex items-center space-x-1.5 transition-all font-semibold"
                title="Re-fetch comments from YouTube with current Settings limits"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Comments'}</span>
              </button>
            </div>

            {publicComments.length === 0 ? (
              <div className="text-center py-10 text-gray-500 text-xs">
                No public YouTube comments imported for this video.
              </div>
            ) : (
              (() => {
                // Organize comments into parent -> child hierarchy
                let topLevel = publicComments.filter(c => !c.parent_id);

                // Apply Sorting
                if (sortBy === 'likes') {
                  topLevel.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
                } else if (sortBy === 'time') {
                  topLevel.sort((a, b) => {
                    const timeA = (a.timestamp_sec !== null && a.timestamp_sec !== undefined) ? a.timestamp_sec : Infinity;
                    const timeB = (b.timestamp_sec !== null && b.timestamp_sec !== undefined) ? b.timestamp_sec : Infinity;
                    return timeA - timeB;
                  });
                }
                const childrenMap = new Map();

                publicComments.forEach(c => {
                  if (c.parent_id) {
                    if (!childrenMap.has(c.parent_id)) childrenMap.set(c.parent_id, []);
                    childrenMap.get(c.parent_id).push(c);
                  }
                });

                // Recursive comment thread renderer
                const renderThread = (comment, level = 0) => {
                  const directReplies = childrenMap.get(comment.id) || [];
                  const hasTimestamp = comment.timestamp_sec !== null && comment.timestamp_sec !== undefined && !isNaN(comment.timestamp_sec) && comment.timestamp_sec > 0;

                  return (
                    <div 
                      key={comment.id}
                      className={`space-y-2 ${level > 0 ? 'ml-4 pl-3 border-l border-emerald-500/20' : ''}`}
                    >
                      <div 
                        className={`bg-[#121212] hover:bg-[#252525] p-3 rounded-xl border transition-all space-y-1.5 ${
                          hasTimestamp ? 'border-emerald-500/30' : 'border-[#272727]'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-1.5">
                            {level > 0 && <CornerDownRight className="w-3 h-3 text-emerald-400 shrink-0" />}
                            <span className="font-semibold text-emerald-400">
                              {comment.author}
                            </span>
                          </div>

                          {/* Likes Count Badge */}
                          <div className="flex items-center space-x-1 text-[11px] text-gray-400 font-mono">
                            <ThumbsUp className="w-3 h-3 text-emerald-500" />
                            <span>{comment.likes_count ? comment.likes_count.toLocaleString() : 0}</span>
                          </div>
                        </div>

                        <div className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">
                          {renderCommentWithInlineLinks(comment.content, false, comment.timestamp_sec)}
                        </div>
                      </div>

                      {/* Render Direct Sub-Comments */}
                      {directReplies.length > 0 && (
                        <div className="space-y-2 pt-1">
                          {directReplies.map(reply => renderThread(reply, level + 1))}
                        </div>
                      )}
                    </div>
                  );
                };

                return topLevel.map(c => renderThread(c, 0));
              })()
            )}
          </div>
        )}

        {/* LOCAL NOTES TAB (YELLOW THEME) */}
        {activeTab === 'notes' && (
          <div className="space-y-4">
            {/* New Note Form */}
            <form onSubmit={handleAddNote} className="bg-[#121212] p-3 rounded-xl border border-[#272727] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-yellow-400 flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Add Timestamped Note</span>
                </span>
                <div className="flex items-center space-x-1 text-xs">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="number"
                    placeholder="Sec"
                    value={customTimestamp}
                    onChange={(e) => setCustomTimestamp(e.target.value)}
                    className="w-16 bg-[#1f1f1f] text-white border border-[#3f3f3f] px-2 py-0.5 rounded text-xs font-mono focus:outline-none"
                  />
                  <span className="text-gray-400 text-[10px]">sec</span>
                </div>
              </div>

              <textarea
                rows="2"
                placeholder="Write markdown note (e.g. **Key takeaway**: check lighting)..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                className="w-full bg-[#1f1f1f] text-gray-100 placeholder-gray-500 text-xs p-2.5 rounded-lg border border-[#272727] focus:border-yellow-500 focus:outline-none resize-none"
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!noteContent.trim()}
                  className="bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-black px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Save Note</span>
                </button>
              </div>
            </form>

            {/* Local Notes Feed */}
            {localNotes.length === 0 ? (
              <div className="text-center py-10 text-gray-500 text-xs">
                No personal notes added yet. Use the form above to pin notes to video timestamps.
              </div>
            ) : (
              <div className="space-y-2">
                {localNotes.map((note) => {
                  const hasTimestamp = note.timestamp_sec !== null && note.timestamp_sec !== undefined && !isNaN(note.timestamp_sec) && note.timestamp_sec > 0;
                  return (
                    <div 
                      key={note.id} 
                      className={`bg-[#121212] hover:bg-[#252525] p-3 rounded-xl border transition-all group ${
                        hasTimestamp ? 'border-yellow-500/30' : 'border-[#272727]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-semibold text-yellow-400">Personal Note</span>
                        <button
                          onClick={() => handleDelete(note.id)}
                          className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-opacity p-1"
                          title="Delete note"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-xs text-gray-200 leading-relaxed whitespace-pre-wrap">
                        {renderCommentWithInlineLinks(note.content, true, note.timestamp_sec)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
