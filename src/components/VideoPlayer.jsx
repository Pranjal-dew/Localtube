import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, PictureInPicture, FastForward, Bookmark, ListVideo } from 'lucide-react';
import TimelineMarkers from './TimelineMarkers';
import ChaptersList from './ChaptersList';
import { db } from '../services/db';

export default function VideoPlayer({ video, comments, onAddQuickNote }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showControls, setShowControls] = useState(true);

  // Resume playback position on video load
  useEffect(() => {
    if (videoRef.current && video) {
      videoRef.current.currentTime = video.last_position_sec || 0;
      setCurrentTime(video.last_position_sec || 0);
    }
  }, [video?.id]);

  // Periodic Playback State Saving (every 5 seconds)
  useEffect(() => {
    if (!video) return;
    const saveInterval = setInterval(() => {
      if (videoRef.current && !videoRef.current.paused) {
        const time = videoRef.current.currentTime;
        const dur = videoRef.current.duration || video.duration_sec || 1;
        db.updatePlaybackState(video.id, time, dur);
      }
    }, 5000);

    return () => clearInterval(saveInterval);
  }, [video?.id]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (timeSec) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timeSec;
      setCurrentTime(timeSec);
      if (!isPlaying) {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleScrubChange = (e) => {
    const time = parseFloat(e.target.value);
    handleSeek(time);
  };

  const handleVolumeChange = (e) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (videoRef.current) {
      videoRef.current.volume = vol;
      setIsMuted(vol === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuteState = !isMuted;
      setIsMuted(newMuteState);
      videoRef.current.muted = newMuteState;
    }
  };

  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.parentElement.requestFullscreen();
      }
    }
  };

  const togglePiP = async () => {
    if (videoRef.current) {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    }
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const currentChapter = video?.chapters?.find((ch, idx) => {
    const nextStart = video.chapters[idx + 1] ? video.chapters[idx + 1].start_time : Infinity;
    return currentTime >= ch.start_time && currentTime < nextStart;
  });

  if (!video) {
    return (
      <div className="w-full aspect-video bg-[#1f1f1f] rounded-2xl flex flex-col items-center justify-center text-gray-500 border border-[#272727]">
        <p className="text-sm">Select a video from your library to start playing</p>
      </div>
    );
  }

  const totalDur = duration || video.duration_sec || 1;

  return (
    <div className="flex flex-col space-y-3">
      {/* Main Player Container */}
      <div 
        className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden group shadow-2xl border border-[#272727]"
        onMouseEnter={() => setShowControls(true)}
      >
        <video
          ref={videoRef}
          src={video.file_path}
          poster={video.thumbnail_path}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          onClick={togglePlay}
          className="w-full h-full object-contain cursor-pointer"
        />

        {/* Current Active Chapter Banner Overlay */}
        {currentChapter && (
          <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md border border-white/10 text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-lg">
            <ListVideo className="w-3.5 h-3.5 text-red-500" />
            <span className="text-gray-400">Chapter:</span>
            <span className="text-red-400">{currentChapter.title}</span>
          </div>
        )}

        {/* Custom Video Controls Bar */}
        <div 
          className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-12 pb-3 px-4 transition-opacity duration-300 flex flex-col space-y-2 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Interactive Scrub Bar with Visual Chapter Gaps */}
          <div className="relative w-full h-2 flex items-center group/scrub">
            {/* Visual Chapter Gap Markers */}
            {video?.chapters && video.chapters.map((ch, idx) => (
              idx > 0 && (
                <div
                  key={idx}
                  className="absolute top-0 bottom-0 w-0.5 bg-black z-20 pointer-events-none"
                  style={{ left: `${(ch.start_time / totalDur) * 100}%` }}
                />
              )
            ))}

            {/* Base Progress Bar */}
            <input
              type="range"
              min="0"
              max={totalDur}
              value={currentTime}
              onChange={handleScrubChange}
              className="absolute inset-0 w-full h-1.5 accent-red-600 bg-gray-700/60 rounded-lg cursor-pointer z-10 appearance-none group-hover/scrub:h-2 transition-all"
            />

            {/* Timeline Pin Markers Overlay */}
            <TimelineMarkers 
              comments={comments} 
              duration={totalDur} 
              onSeek={handleSeek} 
            />
          </div>

          {/* Controls Bar Row */}
          <div className="flex items-center justify-between text-white text-xs pt-1">
            {/* Left Controls */}
            <div className="flex items-center space-x-4">
              <button 
                onClick={togglePlay}
                className="hover:text-red-500 transition-colors p-1 focus:outline-none"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
              </button>

              <div className="flex items-center space-x-2 group/vol">
                <button onClick={toggleMute} className="hover:text-red-500 transition-colors p-1">
                  {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 h-1 accent-red-600 cursor-pointer"
                />
              </div>

              <span className="text-[11px] font-mono text-gray-300">
                {formatTime(currentTime)} / {formatTime(totalDur)}
              </span>
            </div>

            {/* Right Controls */}
            <div className="flex items-center space-x-3">
              {/* Quick Timestamp Note Capture */}
              <button
                onClick={() => onAddQuickNote(currentTime)}
                className="bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded text-[11px] font-semibold flex items-center space-x-1.5 transition-all"
                title="Add personal note at current timestamp"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Note at {formatTime(currentTime)}</span>
              </button>

              {/* Speed Selector */}
              <select
                value={playbackSpeed}
                onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                className="bg-[#1f1f1f] text-gray-200 border border-[#3f3f3f] text-[11px] rounded px-1.5 py-0.5 focus:outline-none"
              >
                <option value="0.25">0.25x</option>
                <option value="0.5">0.5x</option>
                <option value="0.75">0.75x</option>
                <option value="1">1.0x (Normal)</option>
                <option value="1.25">1.25x</option>
                <option value="1.5">1.5x</option>
                <option value="2">2.0x</option>
              </select>

              <button onClick={togglePiP} className="hover:text-red-500 transition-colors p-1" title="Picture-in-Picture">
                <PictureInPicture className="w-4 h-4" />
              </button>

              <button onClick={toggleFullscreen} className="hover:text-red-500 transition-colors p-1" title="Fullscreen">
                <Maximize className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Video Details Header */}
      <div className="flex flex-col space-y-1 bg-[#1f1f1f] p-4 rounded-2xl border border-[#272727]">
        <h1 className="text-lg font-bold text-white tracking-tight">{video.title}</h1>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-gray-300">{video.channel_name}</span>
            <span>•</span>
            <span>Downloaded Offline</span>
          </div>
          <div className="flex items-center space-x-2 text-[11px]">
            <span className="bg-[#272727] text-gray-300 px-2 py-0.5 rounded border border-[#3f3f3f]">
              Progress: {video.completion_percent || 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Interactive YouTube Video Chapters Section */}
      {video.chapters && video.chapters.length > 0 && (
        <ChaptersList
          chapters={video.chapters}
          currentTime={currentTime}
          onSeek={handleSeek}
        />
      )}
    </div>
  );
}
