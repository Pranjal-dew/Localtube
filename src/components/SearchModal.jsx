import React, { useState, useEffect } from 'react';
import { Search, X, MessageSquare, FileText, Play, Clock } from 'lucide-react';
import { db } from '../services/db';

export default function SearchModal({ isOpen, onClose, onSelectSearchResult }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (query.trim()) {
      const res = db.searchFTS5(query);
      setResults(res);
    } else {
      setResults([]);
    }
  }, [query]);

  if (!isOpen) return null;

  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds === null) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/80 backdrop-blur-sm animate-popover">
      <div className="bg-[#1f1f1f] border border-[#3f3f3f] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Header Bar */}
        <div className="p-4 border-b border-[#272727] flex items-center space-x-3 bg-[#121212]">
          <Search className="w-5 h-5 text-red-500" />
          <input
            type="text"
            autoFocus
            placeholder="Search across video titles, YouTube comments, and local notes (SQLite FTS5)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm focus:outline-none"
          />
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {query.trim() && results.length === 0 && (
            <div className="text-center py-12 text-gray-500 text-xs">
              No matching video titles, YouTube comments, or personal notes found for "{query}".
            </div>
          )}

          {!query.trim() && (
            <div className="text-center py-12 text-gray-500 text-xs">
              Type a word to query your local SQLite FTS5 database index.
            </div>
          )}

          {results.map((item, index) => (
            <div
              key={index}
              onClick={() => {
                onSelectSearchResult(item.video, item.timestamp_sec || 0);
                onClose();
              }}
              className="bg-[#121212] hover:bg-[#252525] p-3.5 rounded-xl border border-[#272727] hover:border-red-500/30 cursor-pointer transition-all flex items-start space-x-3 group"
            >
              {/* Thumbnail */}
              <img
                src={item.video?.thumbnail_path}
                alt=""
                className="w-24 aspect-video object-cover rounded-lg border border-[#3f3f3f] group-hover:scale-105 transition-transform"
              />

              {/* Content Details */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white truncate">
                    {item.video?.title}
                  </h4>
                  {item.timestamp_sec !== undefined && item.timestamp_sec > 0 && (
                    <span className="bg-red-600/20 text-red-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-red-500/30 flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatTime(item.timestamp_sec)}</span>
                    </span>
                  )}
                </div>

                {item.type === 'comment' ? (
                  <div className="flex items-start space-x-1.5 text-xs text-gray-300">
                    {item.is_local ? (
                      <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <MessageSquare className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                    )}
                    <p className="line-clamp-2">
                      <span className="font-semibold text-gray-200">{item.author}: </span>
                      {item.comment_content}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">
                    Video Title & Metadata Match
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
