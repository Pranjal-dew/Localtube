import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const TEST_URLS = [
  'https://youtu.be/lYkR16aXHd8',
  'https://youtu.be/B3P8bQZa3sA',
  'https://youtu.be/WOAavbTcp2A',
  'https://youtu.be/16HMVsXXDV0',
  'https://youtu.be/e5zF0vaSxJg'
];

const DOWNLOAD_TEST_DIR = path.join(process.cwd(), 'downloads', '.full_e2e_test');

console.log('====================================================');
console.log('🎬 Running Full YouTube Video Download & Ingestion Test');
console.log(`📋 Testing ${TEST_URLS.length} URLs (Full Video + Metadata + Comments)`);
console.log('====================================================');

if (!fs.existsSync(DOWNLOAD_TEST_DIR)) {
  fs.mkdirSync(DOWNLOAD_TEST_DIR, { recursive: true });
}

async function testFullDownload(url, index) {
  const itemFolder = path.join(DOWNLOAD_TEST_DIR, `vid_${index}_${Date.now()}`);
  fs.mkdirSync(itemFolder, { recursive: true });

  const outputTemplate = path.join(itemFolder, '%(title)s.%(ext)s');

  const args = [
    '--js-runtimes', 'node',
    '-f', 'b[ext=mp4]/best[ext=mp4]/best',
    '--no-playlist',
    '--write-thumbnail',
    '--convert-thumbnails', 'jpg',
    '--write-info-json',
    '--write-comments',
    '--extractor-args', 'youtube:player_client=android,web;max-comments=10,10,5,5;comment_sort=top',
    '--output', outputTemplate,
    url
  ];

  console.log(`\n----------------------------------------------------`);
  console.log(`[${index + 1}/${TEST_URLS.length}] 📥 Downloading & Ingesting: ${url}`);

  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const nodeEnvPath = `${process.env.PATH || ''}:${path.dirname(process.execPath)}`;
    const child = spawn('yt-dlp', args, { env: { ...process.env, PATH: nodeEnvPath } });

    let errorOutput = '';

    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    child.on('close', (code) => {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

      if (code !== 0) {
        console.error(`❌ [Failed] Download failed for ${url}`);
        console.error('Error details:\n', errorOutput);
        return reject(new Error(`yt-dlp exited with code ${code}`));
      }

      try {
        const files = fs.readdirSync(itemFolder);
        const infoJsonFile = files.find(f => f.endsWith('.info.json'));
        const videoFile = files.find(f => f.endsWith('.mp4') || f.endsWith('.mkv') || f.endsWith('.webm'));
        const thumbFile = files.find(f => f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.webp'));

        if (!infoJsonFile) throw new Error('Missing .info.json file');
        if (!videoFile) throw new Error('Missing downloaded video file (.mp4/.mkv/.webm)');

        const rawJson = fs.readFileSync(path.join(itemFolder, infoJsonFile), 'utf-8');
        const metadata = JSON.parse(rawJson);
        const videoStats = fs.statSync(path.join(itemFolder, videoFile));
        const sizeMB = (videoStats.size / (1024 * 1024)).toFixed(2);

        console.log(`  ✅ Successfully Fetched & Downloaded! (${elapsed}s)`);
        console.log(`     📌 Title: "${metadata.title}"`);
        console.log(`     👤 Channel: ${metadata.uploader || metadata.channel}`);
        console.log(`     ⏱️  Duration: ${metadata.duration}s | 💾 Video Size: ${sizeMB} MB`);
        console.log(`     🖼️  Thumbnail: ${thumbFile || 'None'}`);
        console.log(`     🎞️  Video File: ${videoFile}`);
        console.log(`     💬 Comments Extracted: ${metadata.comments ? metadata.comments.length : 0}`);

        resolve();
      } catch (err) {
        console.error(`❌ [Failed] Ingestion check failed for ${url}:`, err.message);
        reject(err);
      }
    });
  });
}

async function runFullTestSuite() {
  let passedCount = 0;
  for (let i = 0; i < TEST_URLS.length; i++) {
    try {
      await testFullDownload(TEST_URLS[i], i);
      passedCount++;
    } catch (e) {
      console.error(`⚠️ Test failed for URL index ${i}: ${e.message}`);
    }
  }

  console.log('\n====================================================');
  if (passedCount === TEST_URLS.length) {
    console.log(`🎉 ALL ${passedCount}/${TEST_URLS.length} VIDEOS FULLY DOWNLOADED & INGESTED!`);
  } else {
    console.log(`⚠️ ${passedCount}/${TEST_URLS.length} VIDEOS PASSED TEST.`);
  }
  console.log('====================================================');

  // Clean up e2e test downloads
  fs.rmSync(DOWNLOAD_TEST_DIR, { recursive: true, force: true });
  process.exit(passedCount === TEST_URLS.length ? 0 : 1);
}

runFullTestSuite();
