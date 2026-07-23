import React from 'react';
import { History, Play, Clock, CheckCircle } from 'lucide-react';

export default function WatchHistory({ videos, onSelectVideo }) {
  const historyVideos = videos
    .filter(v => v.last_watched_at)
    .sort((a, b) => new Date(b.last_watched_at) - new Date(a.last_watched_at));

  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds === null) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between border-b border-[#272727] pb-3">
        <div className="flex items-center space-x-2">
          <History className="w-5 h-5 text-red-500" />
          <h2 className="text-lg font-bold text-white tracking-tight">Watch History</h2>
        </div>
        <span className="text-xs text-gray-400 font-mono">
          {historyVideos.length} recent sessions saved locally
        </span>
      </div>

      {historyVideos.length === 0 ? (
        <div className="bg-[#1f1f1f] border border-[#272727] rounded-2xl p-12 text-center text-gray-500 space-y-2">
          <History className="w-8 h-8 mx-auto text-gray-600" />
          <p className="text-sm">No playback history recorded yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {historyVideos.map((video) => (
            <div
              key={video.id}
              onClick={() => onSelectVideo(video)}
              className="bg-[#1f1f1f] hover:bg-[#252525] border border-[#272727] hover:border-red-500/40 rounded-2xl overflow-hidden cursor-pointer transition-all shadow-lg group flex flex-col justify-between"
            >
              {/* Thumbnail Container */}
              <div className="relative aspect-video bg-black overflow-hidden">
                <img
                  src={video.thumbnail_path}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="bg-red-600 text-white p-3 rounded-full shadow-lg shadow-red-600/40 transform group-hover:scale-110 transition-transform">
                    <Play className="w-6 h-6 fill-current" />
                  </div>
                </div>

                {/* Duration Badge */}
                <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-mono px-1.5 py-0.5 rounded">
                  {formatTime(video.duration_sec)}
                </span>

                {/* Progress Overlay Bar */}
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gray-700/80">
                  <div 
                    className="h-full bg-red-600"
                    style={{ width: `${video.completion_percent || 0}%` }}
                  />
                </div>
              </div>

              {/* Video Info */}
              <div className="p-3.5 space-y-1 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white line-clamp-2 leading-snug group-hover:text-red-400 transition-colors">
                    {video.title}
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-1">{video.channel_name}</p>
                </div>

                <div className="flex items-center justify-between text-[10px] text-gray-400 pt-2 border-t border-[#272727] mt-2">
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-red-500" />
                    <span>Resume at {formatTime(video.last_position_sec)}</span>
                  </span>

                  <span className="font-semibold text-emerald-400">
                    {video.completion_percent >= 90 ? 'Completed' : `${video.completion_percent}% watched`}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
