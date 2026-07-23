import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Downloads Storage Directory
const DOWNLOAD_DIR = path.join(os.homedir(), 'Videos', 'LocalTubeDownloads');
if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

// Serve local video files & thumbnails to frontend
app.use('/media', express.static(DOWNLOAD_DIR));

// Check yt-dlp binary status
app.get('/api/health', (req, res) => {
  const check = spawn('yt-dlp', ['--version']);
  let version = '';

  check.stdout.on('data', (data) => { version += data.toString(); });
  check.on('close', (code) => {
    if (code === 0) {
      res.json({ status: 'ok', ytdlpVersion: version.trim(), downloadDir: DOWNLOAD_DIR });
    } else {
      res.json({ status: 'warning', message: 'yt-dlp binary not found in PATH' });
    }
  });
  check.on('error', () => {
    res.json({ status: 'warning', message: 'yt-dlp executable not installed' });
  });
});

// Map to track active yt-dlp child processes for cancellation
const activeProcesses = new Map();

// Helper to extract YouTube video ID from URL
function parseYouTubeId(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// Download Endpoint - Executes yt-dlp CLI with cancellation & duplicate detection
app.post('/api/download', (req, res) => {
  const { url, taskId, settings } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'YouTube URL is required' });
  }

  // Dynamic Settings with defaults
  const maxTopComments = settings?.maxTopComments ?? 100;
  const maxSubComments = settings?.maxSubComments ?? 20;
  const maxNestedSubComments = settings?.maxNestedSubComments ?? 10;
  const downloadQuality = settings?.downloadQuality ?? 'best';

  const ytId = parseYouTubeId(url);

  // 1. Check for Duplicate Video in Download Directory
  if (ytId) {
    const existingFolders = fs.readdirSync(DOWNLOAD_DIR);
    for (const folder of existingFolders) {
      const folderPath = path.join(DOWNLOAD_DIR, folder);
      if (fs.statSync(folderPath).isDirectory()) {
        const files = fs.readdirSync(folderPath);
        const infoFile = files.find(f => f.endsWith('.info.json'));
        if (infoFile) {
          try {
            const rawJson = fs.readFileSync(path.join(folderPath, infoFile), 'utf-8');
            const meta = JSON.parse(rawJson);
            if (meta.id === ytId) {
              console.log(`[yt-dlp] Duplicate video detected: ${meta.title} (${ytId})`);
              return res.json({
                alreadyDownloaded: true,
                message: `This video (${meta.title}) is already downloaded in your local library!`
              });
            }
          } catch (e) {
            // continue checking
          }
        }
      }
    }
  }

  // Create unique subfolder for video asset
  const videoId = Date.now().toString();
  const targetFolder = path.join(DOWNLOAD_DIR, videoId);
  fs.mkdirSync(targetFolder, { recursive: true });

  const outputTemplate = path.join(targetFolder, '%(title)s.%(ext)s');

  const cookiesBrowser = settings?.cookiesFromBrowser;

  const args = [
    '--js-runtimes', 'node',
    '-f', 'b[ext=mp4]/best[ext=mp4]/best',
    '--no-playlist',
    '--write-thumbnail',
    '--convert-thumbnails', 'jpg',
    '--write-info-json',
    '--write-comments',
    '--output', outputTemplate
  ];

  if (cookiesBrowser && cookiesBrowser !== 'none') {
    args.push('--cookies-from-browser', cookiesBrowser);
  }

  args.push(url);

  console.log(`[yt-dlp] Launching download task ${taskId || videoId} for URL: ${url}`);

  const nodeEnvPath = `${process.env.PATH || ''}:${path.dirname(process.execPath)}`;
  const child = spawn('yt-dlp', args, { env: { ...process.env, PATH: nodeEnvPath } });
  if (taskId) {
    activeProcesses.set(taskId, { child, targetFolder });
  }

  let errorOutput = '';

  child.stderr.on('data', (data) => {
    errorOutput += data.toString();
  });

  child.on('close', (code) => {
    if (code !== 0) {
      console.error(`[yt-dlp] Execution failed with code ${code}: ${errorOutput}`);
      return res.status(500).json({ error: 'yt-dlp download failed', details: errorOutput });
    }

    try {
      // Parse output folder files
      const files = fs.readdirSync(targetFolder);
      const infoJsonFile = files.find(f => f.endsWith('.info.json'));
      const videoFile = files.find(f => f.endsWith('.mp4') || f.endsWith('.mkv') || f.endsWith('.webm'));
      const thumbFile = files.find(f => f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.webp'));

      let metadata = {};
      if (infoJsonFile) {
        const rawInfo = fs.readFileSync(path.join(targetFolder, infoJsonFile), 'utf-8');
        metadata = JSON.parse(rawInfo);
      }

      // Format Chapters
      const chapters = (metadata.chapters || []).map(ch => ({
        title: ch.title,
        start_time: Math.floor(ch.start_time),
        end_time: Math.floor(ch.end_time)
      }));

      // Format Comments - Extract timestamp if present (ignore 0:00 intro timestamps)
      const parseTimestampAndCleanText = (text) => {
        if (!text) return { timeSec: null, cleanText: text };
        
        // Remove leading 0:00 / 00:00 lines or prefixes
        let cleanText = text.replace(/^(?:0?:00\s*\n?|\n?0?:00\s*)/gi, '').trim();

        // Match timestamp patterns (e.g. 0:31, 1:45, 01:15:30)
        const match = cleanText.match(/\b(?:(\d+):)?([0-5]?\d):([0-5]\d)\b/);
        if (!match) {
          return { timeSec: null, cleanText };
        }

        let seconds = 0;
        if (match[1]) {
          seconds = parseInt(match[1], 10) * 3600 + parseInt(match[2], 10) * 60 + parseInt(match[3], 10);
        } else {
          seconds = parseInt(match[2], 10) * 60 + parseInt(match[3], 10);
        }

        // If parsed seconds is 0, ignore timestamp
        if (seconds === 0) {
          return { timeSec: null, cleanText };
        }

        return { timeSec: seconds, cleanText };
      };

      // Format & Filter Hierarchical Comments according to strict limits:
      // - Top 100 top-level comments based on likes_count
      // - Max 20 sub-comments per top-level comment
      // - Max 10 nested sub-comments per sub-comment
      const rawComments = metadata.comments || [];
      
      // Separate top-level vs reply comments
      const topLevelRaw = rawComments.filter(c => !c.parent || c.parent === 'root');
      const repliesMap = new Map(); // parent_id -> replies array

      rawComments.forEach(c => {
        if (c.parent && c.parent !== 'root') {
          if (!repliesMap.has(c.parent)) repliesMap.set(c.parent, []);
          repliesMap.get(c.parent).push(c);
        }
      });

      // Sort top-level by likes_count desc, slice top N
      topLevelRaw.sort((a, b) => (b.like_count || 0) - (a.like_count || 0));
      const top100Comments = topLevelRaw.slice(0, maxTopComments);

      const formattedComments = [];

      top100Comments.forEach((parentComment, parentIdx) => {
        const parentId = `yt_comment_${Date.now()}_${parentIdx}`;
        const { timeSec, cleanText } = parseTimestampAndCleanText(parentComment.text);

        formattedComments.push({
          id: parentId,
          video_id: metadata.id || videoId,
          author: parentComment.author || `@yt_user`,
          content: cleanText,
          timestamp_sec: timeSec,
          likes_count: parentComment.like_count || 0,
          parent_id: null,
          is_local: 0,
          created_at: new Date().toISOString()
        });

        // Sub-comments (level 1 replies)
        const directReplies = repliesMap.get(parentComment.id) || [];
        directReplies.sort((a, b) => (b.like_count || 0) - (a.like_count || 0));
        const top20SubComments = directReplies.slice(0, maxSubComments);

        top20SubComments.forEach((subComment, subIdx) => {
          const subId = `${parentId}_sub_${subIdx}`;
          const subParsed = parseTimestampAndCleanText(subComment.text);

          formattedComments.push({
            id: subId,
            video_id: metadata.id || videoId,
            author: subComment.author || `@yt_user`,
            content: subParsed.cleanText,
            timestamp_sec: subParsed.timeSec,
            likes_count: subComment.like_count || 0,
            parent_id: parentId,
            is_local: 0,
            created_at: new Date().toISOString()
          });

          // Nested sub-comments (level 2+ replies)
          const nestedReplies = repliesMap.get(subComment.id) || [];
          nestedReplies.sort((a, b) => (b.like_count || 0) - (a.like_count || 0));
          const top10NestedReplies = nestedReplies.slice(0, maxNestedSubComments);

          top10NestedReplies.forEach((nestedComment, nestedIdx) => {
            const nestedId = `${subId}_nested_${nestedIdx}`;
            const nestedParsed = parseTimestampAndCleanText(nestedComment.text);

            formattedComments.push({
              id: nestedId,
              video_id: metadata.id || videoId,
              author: nestedComment.author || `@yt_user`,
              content: nestedParsed.cleanText,
              timestamp_sec: nestedParsed.timeSec,
              likes_count: nestedComment.like_count || 0,
              parent_id: subId,
              is_local: 0,
              created_at: new Date().toISOString()
            });
          });
        });
      });

      const videoUrlPath = videoFile ? `http://localhost:3001/media/${videoId}/${encodeURIComponent(videoFile)}` : '';
      const thumbUrlPath = thumbFile ? `http://localhost:3001/media/${videoId}/${encodeURIComponent(thumbFile)}` : '';

      const videoRecord = {
        id: metadata.id || videoId,
        title: metadata.title || 'Downloaded Video',
        channel_name: metadata.uploader || metadata.channel || 'YouTube Channel',
        duration_sec: Math.floor(metadata.duration || 0),
        file_path: videoUrlPath,
        thumbnail_path: thumbUrlPath,
        chapters: chapters.length > 0 ? chapters : [
          { title: "Beginning", start_time: 0, end_time: Math.floor(metadata.duration || 100) }
        ],
        comments: formattedComments
      };

      console.log(`[yt-dlp] Successfully ingested: ${videoRecord.title}`);
      if (taskId) activeProcesses.delete(taskId);
      res.json({ success: true, video: videoRecord });

    } catch (err) {
      console.error('[yt-dlp] Ingestion parsing error:', err);
      if (taskId) activeProcesses.delete(taskId);
      res.status(500).json({ error: 'Failed to parse downloaded metadata', details: err.message });
    }
  });
});

// Refresh & Sync Comments Endpoint - Re-executes yt-dlp to update likes & comment hierarchy based on current settings
app.post('/api/comments/sync', (req, res) => {
  const { videoId, youtubeUrl, settings } = req.body;
  if (!videoId) {
    return res.status(400).json({ error: 'Video ID is required' });
  }

  const maxTopComments = settings?.maxTopComments ?? 100;
  const maxSubComments = settings?.maxSubComments ?? 20;
  const maxNestedSubComments = settings?.maxNestedSubComments ?? 10;

  console.log(`[yt-dlp] Refreshing comments for video ${videoId} with settings (Top ${maxTopComments}, Sub ${maxSubComments}, Nested ${maxNestedSubComments})`);

  const url = youtubeUrl || `https://www.youtube.com/watch?v=${videoId}`;
  const tempFolder = path.join(DOWNLOAD_DIR, `temp_comments_${videoId}`);
  fs.mkdirSync(tempFolder, { recursive: true });

  const outputTemplate = path.join(tempFolder, '%(id)s.%(ext)s');

  const cookiesBrowser = settings?.cookiesFromBrowser;

  const args = [
    '--js-runtimes', 'node',
    '--skip-download',
    '--write-comments',
    '--write-info-json',
    '--output', outputTemplate
  ];

  if (cookiesBrowser && cookiesBrowser !== 'none') {
    args.push('--cookies-from-browser', cookiesBrowser);
  }

  args.push(url);

  const nodeEnvPath = `${process.env.PATH || ''}:${path.dirname(process.execPath)}`;
  const child = spawn('yt-dlp', args, { env: { ...process.env, PATH: nodeEnvPath } });
  let errorOutput = '';

  child.stderr.on('data', (data) => { errorOutput += data.toString(); });

  child.on('close', (code) => {
    try {
      const files = fs.readdirSync(tempFolder);
      const infoFile = files.find(f => f.endsWith('.info.json'));

      let metadata = {};
      if (infoFile) {
        const rawJson = fs.readFileSync(path.join(tempFolder, infoFile), 'utf-8');
        metadata = JSON.parse(rawJson);
      }

      // Cleanup temp folder
      fs.rmSync(tempFolder, { recursive: true, force: true });

      const rawComments = metadata.comments || [];
      const topLevelRaw = rawComments.filter(c => !c.parent || c.parent === 'root');
      const repliesMap = new Map();

      rawComments.forEach(c => {
        if (c.parent && c.parent !== 'root') {
          if (!repliesMap.has(c.parent)) repliesMap.set(c.parent, []);
          repliesMap.get(c.parent).push(c);
        }
      });

      topLevelRaw.sort((a, b) => (b.like_count || 0) - (a.like_count || 0));
      const topComments = topLevelRaw.slice(0, maxTopComments);

      const parseTimestampAndCleanText = (text) => {
        if (!text) return { timeSec: null, cleanText: text };
        let cleanText = text.replace(/^(?:0?:00\s*\n?|\n?0?:00\s*)/gi, '').trim();
        const match = cleanText.match(/\b(?:(\d+):)?([0-5]?\d):([0-5]\d)\b/);
        if (!match) return { timeSec: null, cleanText };
        let seconds = 0;
        if (match[1]) {
          seconds = parseInt(match[1], 10) * 3600 + parseInt(match[2], 10) * 60 + parseInt(match[3], 10);
        } else {
          seconds = parseInt(match[2], 10) * 60 + parseInt(match[3], 10);
        }
        if (seconds === 0) return { timeSec: null, cleanText };
        return { timeSec: seconds, cleanText };
      };

      const formattedComments = [];

      topComments.forEach((parentComment, parentIdx) => {
        const parentId = `yt_comment_${Date.now()}_${parentIdx}`;
        const { timeSec, cleanText } = parseTimestampAndCleanText(parentComment.text);

        formattedComments.push({
          id: parentId,
          video_id: videoId,
          author: parentComment.author || `@yt_user`,
          content: cleanText,
          timestamp_sec: timeSec,
          likes_count: parentComment.like_count || 0,
          parent_id: null,
          is_local: 0,
          created_at: new Date().toISOString()
        });

        const directReplies = repliesMap.get(parentComment.id) || [];
        directReplies.sort((a, b) => (b.like_count || 0) - (a.like_count || 0));
        const topSubComments = directReplies.slice(0, maxSubComments);

        topSubComments.forEach((subComment, subIdx) => {
          const subId = `${parentId}_sub_${subIdx}`;
          const subParsed = parseTimestampAndCleanText(subComment.text);

          formattedComments.push({
            id: subId,
            video_id: videoId,
            author: subComment.author || `@yt_user`,
            content: subParsed.cleanText,
            timestamp_sec: subParsed.timeSec,
            likes_count: subComment.like_count || 0,
            parent_id: parentId,
            is_local: 0,
            created_at: new Date().toISOString()
          });

          const nestedReplies = repliesMap.get(subComment.id) || [];
          nestedReplies.sort((a, b) => (b.like_count || 0) - (a.like_count || 0));
          const topNestedReplies = nestedReplies.slice(0, maxNestedSubComments);

          topNestedReplies.forEach((nestedComment, nestedIdx) => {
            const nestedId = `${subId}_nested_${nestedIdx}`;
            const nestedParsed = parseTimestampAndCleanText(nestedComment.text);

            formattedComments.push({
              id: nestedId,
              video_id: videoId,
              author: nestedComment.author || `@yt_user`,
              content: nestedParsed.cleanText,
              timestamp_sec: nestedParsed.timeSec,
              likes_count: nestedComment.like_count || 0,
              parent_id: subId,
              is_local: 0,
              created_at: new Date().toISOString()
            });
          });
        });
      });

      res.json({ success: true, comments: formattedComments });

    } catch (err) {
      console.error('[yt-dlp] Sync comments error:', err);
      res.status(500).json({ error: 'Failed to sync comments', details: err.message });
    }
  });
});

// Stop / Cancel Active Download Endpoint
app.post('/api/cancel', (req, res) => {
  const { taskId } = req.body;
  if (!taskId || !activeProcesses.has(taskId)) {
    return res.status(404).json({ error: 'Active download task not found' });
  }

  const { child, targetFolder } = activeProcesses.get(taskId);
  console.log(`[yt-dlp] Cancelling download task: ${taskId}`);

  try {
    child.kill('SIGKILL');
    activeProcesses.delete(taskId);

    // Clean up partial download files
    if (fs.existsSync(targetFolder)) {
      fs.rmSync(targetFolder, { recursive: true, force: true });
    }

    res.json({ success: true, message: 'Download stopped and temporary files cleaned' });
  } catch (err) {
    console.error('[yt-dlp] Failed to kill child process:', err);
    res.status(500).json({ error: 'Failed to cancel download process' });
  }
});

app.listen(PORT, () => {
  console.log(`[LocalTube Backend] Express server running on http://localhost:${PORT}`);
  console.log(`[LocalTube Media] Videos saved to: ${DOWNLOAD_DIR}`);
});
