import React, { useState } from 'react';
import { ListVideo, ChevronRight, Play, Clock, Sparkles } from 'lucide-react';

export default function ChaptersList({ chapters, currentTime, onSeek }) {
  if (!chapters || chapters.length === 0) return null;

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Find currently playing active chapter
  const activeChapterIndex = chapters.findIndex((ch, idx) => {
    const nextStart = chapters[idx + 1] ? chapters[idx + 1].start_time : Infinity;
    return currentTime >= ch.start_time && currentTime < nextStart;
  });

  return (
    <div className="bg-[#1f1f1f] border border-[#272727] rounded-2xl p-4 space-y-3 shadow-lg">
      <div className="flex items-center justify-between border-b border-[#272727] pb-2">
        <div className="flex items-center space-x-2">
          <ListVideo className="w-4 h-4 text-red-500" />
          <h3 className="text-xs font-bold text-white tracking-tight">Video Chapters</h3>
        </div>
        <span className="text-[10px] font-mono bg-[#272727] text-gray-300 px-2 py-0.5 rounded">
          {chapters.length} chapters
        </span>
      </div>

      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
        {chapters.map((chapter, idx) => {
          const isActive = idx === activeChapterIndex;
          return (
            <button
              key={idx}
              onClick={() => onSeek(chapter.start_time)}
              className={`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between transition-all group ${
                isActive
                  ? 'bg-red-600/20 border border-red-500/40 text-white font-semibold'
                  : 'hover:bg-[#252525] text-gray-300 border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className={`p-1 rounded-lg ${isActive ? 'bg-red-600 text-white' : 'bg-[#272727] text-gray-400 group-hover:text-white'}`}>
                  <Play className="w-3 h-3 fill-current" />
                </div>
                <span className="truncate text-xs group-hover:text-red-400 transition-colors">
                  {chapter.title}
                </span>
              </div>

              <div className="flex items-center space-x-1 shrink-0 ml-2">
                <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded ${isActive ? 'bg-red-500/20 text-red-400' : 'bg-[#121212] text-gray-400'}`}>
                  {formatTime(chapter.start_time)}
                </span>
                <ChevronRight className={`w-3.5 h-3.5 ${isActive ? 'text-red-400' : 'text-gray-600 group-hover:text-gray-300'}`} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
