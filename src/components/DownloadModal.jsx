import React, { useState, useEffect } from 'react';
import { Download, X, CheckCircle, AlertCircle, RefreshCw, Terminal, Sparkles, Youtube } from 'lucide-react';
import { downloader } from '../services/downloader';

export default function DownloadModal({ isOpen, onClose, onVideoImported }) {
  const [url, setUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');
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

    downloader.downloadVideo(url.trim(), customTitle.trim());
    setUrl('');
    setCustomTitle('');
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
                type="url"
                required
                placeholder="https://www.youtube.com/watch?v=..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-[#121212] text-white placeholder-gray-500 border border-[#3f3f3f] focus:border-red-500 rounded-xl p-3 text-xs focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Custom Title (Optional)
              </label>
              <input
                type="text"
                placeholder="Override default video title..."
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full bg-[#121212] text-white placeholder-gray-500 border border-[#3f3f3f] focus:border-red-500 rounded-xl p-2.5 text-xs focus:outline-none transition-colors"
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

              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {queue.map((task) => (
                  <div 
                    key={task.id} 
                    className="bg-[#121212] p-3 rounded-xl border border-[#272727] space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white truncate max-w-[240px]">
                        {task.title}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-mono text-gray-400">
                          {task.status === 'downloading' && `${task.progress}% (${task.speed})`}
                          {task.status === 'parsing' && 'Ingesting JSON...'}
                          {task.status === 'completed' && <span className="text-emerald-400 font-bold">Done</span>}
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

                    {/* Progress Bar */}
                    <div className="w-full bg-[#272727] h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          task.status === 'completed' ? 'bg-emerald-500' : 'bg-red-600'
                        }`}
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
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
