import React, { useState } from 'react';
import { MessageSquare, FileText, User } from 'lucide-react';

export default function TimelineMarkers({ comments, duration, onSeek }) {
  const [hoveredComment, setHoveredComment] = useState(null);

  const timestampComments = comments.filter(c => c.timestamp_sec !== null && c.timestamp_sec !== undefined && !isNaN(c.timestamp_sec));

  if (!duration || duration <= 0 || timestampComments.length === 0) {
    return null;
  }

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="absolute inset-x-0 bottom-0 top-0 pointer-events-none z-20">
      {timestampComments.map((comment) => {
        const timeSec = comment.timestamp_sec;
        const leftPercent = Math.min(100, Math.max(0, (timeSec / duration) * 100));
        const isLocal = comment.is_local === 1;

        return (
          <div
            key={comment.id}
            className="absolute top-0 bottom-0 -translate-x-1/2 pointer-events-auto group cursor-pointer flex items-center justify-center"
            style={{ left: `${leftPercent}%` }}
            onClick={(e) => {
              e.stopPropagation();
              onSeek(timeSec);
            }}
            onMouseEnter={() => setHoveredComment(comment)}
            onMouseLeave={() => setHoveredComment(null)}
          >
            {/* Ultra-thin Vertical Line Tick Marker */}
            <div 
              className={`w-[1.5px] h-full rounded-full transition-all group-hover:w-[2.5px] ${
                isLocal 
                  ? 'bg-yellow-400' 
                  : 'bg-emerald-400'
              }`}
            />

            {/* Hover Tooltip Preview */}
            {hoveredComment && hoveredComment.id === comment.id && (
              <div 
                className="absolute bottom-6 left-1/2 -translate-x-1/2 w-64 bg-[#1f1f1f]/95 border border-[#3f3f3f] rounded-lg p-2.5 shadow-2xl z-50 text-left pointer-events-none animate-popover backdrop-blur-md"
              >
                <div className="flex items-center justify-between border-b border-[#272727] pb-1.5 mb-1.5">
                  <div className="flex items-center space-x-1.5">
                    {isLocal ? (
                      <FileText className="w-3.5 h-3.5 text-yellow-400" />
                    ) : (
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    <span className="text-[11px] font-semibold text-gray-200 truncate">
                      {isLocal ? 'Personal Note' : comment.author}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-[#272727] text-gray-300 px-1.5 py-0.5 rounded">
                    {formatTime(timeSec)}
                  </span>
                </div>

                <p className="text-xs text-gray-300 line-clamp-3 leading-relaxed">
                  {comment.content}
                </p>

                <div className="mt-1 text-[9px] text-gray-500 text-right">
                  Click line to jump
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

