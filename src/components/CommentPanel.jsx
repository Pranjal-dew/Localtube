import React, { useState } from 'react';
import { MessageSquare, FileText, Plus, Trash2, Clock, Send, Sparkles, ThumbsUp, CornerDownRight, ChevronDown, ChevronUp, RefreshCw, ArrowUpDown, Reply } from 'lucide-react';
import { db } from '../services/db';

// Helper to format date & time (e.g. Jul 24, 2026, 2:40 AM)
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

// Helper to format seconds into mm:ss (e.g. 90 -> 1:30)
const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds === null) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

// Helper to extract timestamp in seconds from text (e.g. "Check 1:30") or fallback pin
const extractTimestampSec = (text, fallbackSecStr) => {
  if (fallbackSecStr !== '' && fallbackSecStr !== null && fallbackSecStr !== undefined) {
    const parsed = parseInt(fallbackSecStr, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  if (!text) return 0;
  const match = /\b(?:(\d+):)?([0-5]?\d):([0-5]\d)\b/.exec(text);
  if (match) {
    let sec = 0;
    if (match[1]) {
      sec = parseInt(match[1], 10) * 3600 + parseInt(match[2], 10) * 60 + parseInt(match[3], 10);
    } else {
      sec = parseInt(match[2], 10) * 60 + parseInt(match[3], 10);
    }
    return sec;
  }
  return 0;
};

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

    const timeSec = extractTimestampSec(noteContent, customTimestamp);

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

  const handleAddReply = (replyData) => {
    if (!video) return;
    db.insertComment({
      video_id: video.id,
      author: "Me",
      content: replyData.content,
      timestamp_sec: replyData.timestamp_sec || 0,
      is_local: 1,
      parent_id: replyData.parent_id
    });
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
            {/* Sync & Sort Action Bar with Database Last Synced Timestamp */}
            <div className="flex flex-col space-y-1.5 bg-[#121212] px-3 py-2.5 rounded-xl border border-emerald-500/20">
              <div className="flex items-center justify-between">
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

              {/* DB Last Synced Indicator */}
              <div className="flex items-center space-x-1.5 text-[10px] text-gray-400 border-t border-white/5 pt-1.5">
                <Clock className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>YouTube DB Last Synced:</span>
                <span className="text-emerald-400 font-medium">
                  {video?.last_comments_synced_at ? formatDateTime(video.last_comments_synced_at) : 'Not synced yet'}
                </span>
              </div>
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

                // Recursive comment thread renderer component with Show More/Less and Nested Replies Dropdown
                return topLevel.map(c => (
                  <CommentThreadItem
                    key={c.id}
                    comment={c}
                    level={0}
                    childrenMap={childrenMap}
                    renderCommentWithInlineLinks={renderCommentWithInlineLinks}
                    onAddReply={handleAddReply}
                  />
                ));
              })()
            )}
          </div>
        )}

        {/* LOCAL NOTES TAB (YELLOW THEME) */}
        {activeTab === 'notes' && (
          <div className="space-y-4">
            {/* Clean New Note Form with optional pinned timestamp badge */}
            <form onSubmit={handleAddNote} className="bg-[#121212] p-3 rounded-xl border border-[#272727] space-y-2">
              {customTimestamp && (
                <div className="flex items-center justify-between text-[11px] bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 px-2.5 py-1 rounded-lg animate-popover">
                  <span className="flex items-center space-x-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Pinned to video position: <strong>{formatTime(parseInt(customTimestamp, 10))}</strong></span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomTimestamp('');
                      if (clearQuickNoteTimestamp) clearQuickNoteTimestamp();
                    }}
                    className="text-yellow-400/70 hover:text-yellow-400 font-bold text-xs px-1"
                    title="Clear timestamp pin"
                  >
                    ✕
                  </button>
                </div>
              )}

              <textarea
                rows="2"
                placeholder="Write a personal note... (timestamps like 1:30 auto-link and add marker to timeline)"
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

            {/* Local Notes Feed with Nested Replies support */}
            {localNotes.length === 0 ? (
              <div className="text-center py-10 text-gray-500 text-xs">
                No personal notes added yet. Use the form above to add notes or replies.
              </div>
            ) : (
              (() => {
                const localTopLevel = localNotes.filter(c => !c.parent_id);
                const localChildrenMap = new Map();
                localNotes.forEach(c => {
                  if (c.parent_id) {
                    if (!localChildrenMap.has(c.parent_id)) localChildrenMap.set(c.parent_id, []);
                    localChildrenMap.get(c.parent_id).push(c);
                  }
                });

                return (
                  <div className="space-y-2">
                    {localTopLevel.map((note) => (
                      <CommentThreadItem
                        key={note.id}
                        comment={note}
                        level={0}
                        childrenMap={localChildrenMap}
                        renderCommentWithInlineLinks={renderCommentWithInlineLinks}
                        isLocal={true}
                        onDelete={handleDelete}
                        onAddReply={handleAddReply}
                      />
                    ))}
                  </div>
                );
              })()
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Sub-component to manage state for individual comment/note item (Show More/Less, Reply Form, and Nested Replies Dropdown)
function CommentThreadItem({ 
  comment, 
  level = 0, 
  childrenMap, 
  renderCommentWithInlineLinks, 
  isLocal = false, 
  onDelete = null,
  onAddReply = null
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');

  const directReplies = childrenMap ? (childrenMap.get(comment.id) || []) : [];
  const hasTimestamp = comment.timestamp_sec !== null && comment.timestamp_sec !== undefined && !isNaN(comment.timestamp_sec) && comment.timestamp_sec > 0;
  
  const contentText = comment.content || '';
  const isLongText = contentText.length > 200 || contentText.split('\n').length > 3;

  const handleReplySubmit = (e) => {
    e.preventDefault();
    if (!replyText.trim() || !onAddReply) return;
    const timeSec = extractTimestampSec(replyText.trim(), null);
    onAddReply({
      content: replyText.trim(),
      timestamp_sec: timeSec,
      parent_id: comment.id
    });
    setReplyText('');
    setIsReplying(false);
    setShowReplies(true);
  };

  return (
    <div className={`space-y-2 ${level > 0 ? 'ml-4 pl-3 border-l border-emerald-500/20' : ''}`}>
      <div 
        className={`bg-[#121212] hover:bg-[#252525] p-3 rounded-xl border transition-all space-y-1.5 group ${
          isLocal 
            ? (hasTimestamp ? 'border-yellow-500/30' : 'border-[#272727]')
            : (hasTimestamp ? 'border-emerald-500/30' : 'border-[#272727]')
        }`}
      >
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1.5 flex-wrap gap-y-0.5">
            {level > 0 && <CornerDownRight className="w-3 h-3 text-emerald-400 shrink-0" />}
            <span className={`font-semibold ${isLocal ? 'text-yellow-400' : 'text-emerald-400'}`}>
              {isLocal ? 'Personal Note' : comment.author}
            </span>
            {comment.created_at && (
              <span className="text-[10px] text-gray-400 font-normal">
                · {formatDateTime(comment.created_at)}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2 text-[11px]">
            {!isLocal && (
              <div className="flex items-center space-x-1 text-gray-400 font-mono">
                <ThumbsUp className="w-3 h-3 text-emerald-500" />
                <span>{comment.likes_count ? comment.likes_count.toLocaleString() : 0}</span>
              </div>
            )}

            {/* Double Confirmation on Delete for Local Notes */}
            {isLocal && onDelete && (
              <div>
                {isConfirmingDelete ? (
                  <div className="flex items-center space-x-1 bg-red-500/20 border border-red-500/30 px-2 py-0.5 rounded-lg animate-popover">
                    <span className="text-[10px] text-red-300 font-medium">Delete?</span>
                    <button
                      onClick={() => onDelete(comment.id)}
                      className="text-[10px] font-bold text-red-400 hover:underline px-1"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setIsConfirmingDelete(false)}
                      className="text-[10px] text-gray-400 hover:underline px-1"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsConfirmingDelete(true)}
                    className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-opacity p-1"
                    title="Delete note"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Comment Text Content with Line Clamping */}
        <div className={`text-xs text-gray-300 leading-relaxed whitespace-pre-wrap ${
          isLongText && !isExpanded ? 'line-clamp-3' : ''
        }`}>
          {renderCommentWithInlineLinks(comment.content, isLocal, comment.timestamp_sec)}
        </div>

        {/* Action Row: Show More / Show Less & Reply Button */}
        <div className="flex items-center justify-between pt-1">
          {isLongText ? (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`text-[11px] font-semibold hover:underline focus:outline-none transition-colors ${
                isLocal ? 'text-yellow-400' : 'text-emerald-400'
              }`}
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </button>
          ) : <div />}

          {/* Reply Button for Local Notes */}
          {isLocal && onAddReply && (
            <button
              onClick={() => setIsReplying(!isReplying)}
              className="text-[11px] font-semibold text-yellow-400/80 hover:text-yellow-400 flex items-center space-x-1 transition-colors ml-auto"
            >
              <Reply className="w-3 h-3" />
              <span>{isReplying ? 'Cancel' : 'Reply'}</span>
            </button>
          )}
        </div>

        {/* Inline Reply Form */}
        {isReplying && (
          <form onSubmit={handleReplySubmit} className="mt-2 space-y-2 bg-[#181818] p-2.5 rounded-xl border border-yellow-500/30">
            <textarea
              rows="2"
              placeholder="Write a reply to this note..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="w-full bg-[#1f1f1f] text-gray-100 placeholder-gray-500 text-xs p-2 rounded-lg border border-[#3f3f3f] focus:border-yellow-500 focus:outline-none resize-none"
              autoFocus
            />
            <div className="flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => { setIsReplying(false); setReplyText(''); }}
                className="text-[11px] text-gray-400 hover:text-gray-200 px-2 py-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!replyText.trim()}
                className="bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-black px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1"
              >
                <Send className="w-3 h-3" />
                <span>Save Reply</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Direct Sub-Comments Dropdown Toggle */}
      {directReplies.length > 0 && (
        <div className="pt-0.5">
          <button
            onClick={() => setShowReplies(!showReplies)}
            className={`flex items-center space-x-1.5 text-xs font-semibold px-2.5 py-1 rounded-full w-fit transition-colors cursor-pointer ${
              isLocal 
                ? 'text-yellow-400 hover:bg-yellow-500/10'
                : 'text-emerald-400 hover:bg-emerald-500/10'
            }`}
          >
            {showReplies ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
            <span>
              {showReplies
                ? `Hide ${directReplies.length === 1 ? 'reply' : `${directReplies.length} replies`}`
                : `${directReplies.length} ${directReplies.length === 1 ? 'reply' : 'replies'}`}
            </span>
          </button>

          {/* Rendered Direct Replies inside dropdown */}
          {showReplies && (
            <div className="space-y-2 pt-2">
              {directReplies.map(reply => (
                <CommentThreadItem
                  key={reply.id}
                  comment={reply}
                  level={level + 1}
                  childrenMap={childrenMap}
                  renderCommentWithInlineLinks={renderCommentWithInlineLinks}
                  isLocal={isLocal}
                  onDelete={onDelete}
                  onAddReply={onAddReply}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
