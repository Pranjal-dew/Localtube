import React, { useState, useEffect } from 'react';
import { Download, X, CheckCircle, AlertCircle, RefreshCw, Terminal, Sparkles, Youtube } from 'lucide-react';
import { downloader } from '../services/downloader';

export default function DownloadModal({ isOpen, onClose, onVideoImported }) {
  const [url, setUrl] = useState('');
  const [queue, setQueue] = useState([]);
  const [showCliPreview, setShowCliPreview] = useState(false);

  useEffect(() => {
    return downloader.subscribe((updatedQueue) => {
      setQueue(updatedQueue);
      // Auto refresh video library if any download completed
      if (updatedQueue.some(q => q.status === 'completed')) {
        if (onVideoImported) onVideoImported();
      }
    });
  }, [onVideoImported]);

  if (!isOpen) return null;

  const handleStartDownload = (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    downloader.downloadVideo(url.trim());
    setUrl('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-popover">
      <div className="bg-[#1f1f1f] border border-[#3f3f3f] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#272727] flex items-center justify-between bg-[#121212]">
          <div className="flex items-center space-x-2">
            <div className="bg-red-600/20 text-red-500 p-1.5 rounded-lg border border-red-500/30">
              <Youtube className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">YouTube Downloader Core</h2>
              <p className="text-[11px] text-gray-400">Integrated yt-dlp CLI engine & metadata parser</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Download Form */}
          <form onSubmit={handleStartDownload} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                YouTube Video or Playlist URL
              </label>
              <input
                type="text"
                required
                placeholder="https://youtu.be/... or https://www.youtube.com/watch?v=..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-[#121212] text-white placeholder-gray-500 border border-[#3f3f3f] focus:border-red-500 rounded-xl p-3 text-xs focus:outline-none transition-colors"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setShowCliPreview(!showCliPreview)}
                className="text-[11px] text-gray-400 hover:text-red-400 flex items-center space-x-1"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>{showCliPreview ? 'Hide' : 'Inspect'} yt-dlp Command</span>
              </button>

              <button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all shadow-md shadow-red-600/20 active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Fetch Now & Ingest</span>
              </button>
            </div>
          </form>

          {/* yt-dlp Command CLI Code Snippet Preview */}
          {showCliPreview && (
            <div className="bg-black/90 p-3 rounded-xl border border-[#3f3f3f] font-mono text-[11px] text-gray-300 space-y-1 overflow-x-auto">
              <div className="text-gray-500 text-[10px]"># Executed in app backend core:</div>
              <div className="text-emerald-400">
                yt-dlp --format "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" \
              </div>
              <div className="pl-4 text-sky-400">--write-thumbnail --convert-thumbnails jpg \</div>
              <div className="pl-4 text-sky-400">--write-info-json --write-comments \</div>
              <div className="pl-4 text-yellow-400">--output "%(id)s/%(title)s.%(ext)s" "{url || '<YOUTUBE_URL>'}"</div>
            </div>
          )}

          {/* Active & Completed Download Queue */}
          {queue.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-[#272727]">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-300">
                <span>Download Queue ({queue.length})</span>
                <button 
                  onClick={() => downloader.clearCompleted()}
                  className="text-[11px] text-gray-400 hover:text-white"
                >
                  Clear Completed
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {queue.map((task) => (
                  <div 
                    key={task.id} 
                    className="bg-[#121212] p-3 rounded-xl border border-[#272727] space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white truncate max-w-[260px]">
                        {task.title}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] font-mono font-bold text-gray-300">
                          {task.status === 'completed' && <span className="text-emerald-400">✅ Done</span>}
                          {task.status === 'error' && <span className="text-red-400">❌ Error</span>}
                          {task.status === 'downloading' && (
                            <span className="text-red-400">{Math.round(task.progress || 0)}%</span>
                          )}
                        </span>
                        {task.status === 'downloading' && (
                          <button
                            onClick={() => downloader.cancelDownload(task.id)}
                            className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white px-2 py-0.5 rounded text-[10px] font-bold border border-red-500/30 transition-all"
                            title="Stop & cancel download process"
                          >
                            Stop
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Live Speed & ETA Indicators */}
                    {task.status === 'downloading' && (
                      <div className="flex items-center justify-between text-[11px] font-mono text-gray-400 bg-black/40 px-2.5 py-1 rounded-lg border border-[#222]">
                        <span className="truncate max-w-[240px] text-gray-300">
                          {task.eta || 'Processing...'}
                        </span>
                        {task.speed && task.speed !== 'Connecting...' && (
                          <span className="text-emerald-400 font-semibold shrink-0 ml-2">
                            ⚡ {task.speed}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Progress Bar */}
                    <div className="w-full bg-[#272727] h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          task.status === 'completed' ? 'bg-emerald-500' : task.status === 'error' ? 'bg-red-500' : 'bg-gradient-to-r from-red-600 to-amber-500 animate-pulse'
                        }`}
                        style={{ width: `${Math.max(2, Math.min(100, task.progress || 0))}%` }}
                      />
                    </div>

                    {/* Live Debugging Logs Terminal Stream */}
                    {task.logs && task.logs.length > 0 && (
                      <details className="text-[10px] font-mono bg-black/80 p-2 rounded-lg border border-[#272727] text-gray-400 space-y-0.5">
                        <summary className="cursor-pointer text-gray-400 hover:text-gray-200 select-none flex items-center justify-between">
                          <span>yt-dlp Live Stream ({task.logs.length} lines)</span>
                          <span className="text-gray-500 text-[9px]">Click to inspect</span>
                        </summary>
                        <div className="max-h-24 overflow-y-auto space-y-0.5 pt-1.5 border-t border-[#222]">
                          {task.logs.slice(-10).map((logLine, idx) => (
                            <div key={idx} className="truncate text-gray-300 hover:text-white">
                              {logLine}
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
