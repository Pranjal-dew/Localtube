import { Given, When, Then, setWorldConstructor, Before, After, setDefaultTimeout } from '@cucumber/cucumber';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import assert from 'assert';

setDefaultTimeout(60000);

class CustomWorld {
  constructor() {
    this.currentUrl = null;
    this.testFolder = null;
    this.metadata = null;
  }
}

setWorldConstructor(CustomWorld);

Before(function () {
  const timestamp = Date.now() + '_' + Math.floor(Math.random() * 1000);
  this.testFolder = path.join(process.cwd(), 'downloads', `.cucumber_test_${timestamp}`);
  fs.mkdirSync(this.testFolder, { recursive: true });
});

After(function () {
  if (this.testFolder && fs.existsSync(this.testFolder)) {
    fs.rmSync(this.testFolder, { recursive: true, force: true });
  }
});

Given('the backend download service is ready', function () {
  assert.strictEqual(typeof spawn, 'function', 'child_process spawn must be available');
  assert.ok(fs.existsSync(this.testFolder), 'Test workspace folder must exist');
});

When('I submit the YouTube URL {string} for processing', async function (url) {
  this.currentUrl = url;
  const outputTemplate = path.join(this.testFolder, '%(title)s.%(ext)s');

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

  const nodeEnvPath = `${process.env.PATH || ''}:${path.dirname(process.execPath)}`;

  await new Promise((resolve, reject) => {
    const child = spawn('yt-dlp', args, { env: { ...process.env, PATH: nodeEnvPath } });
    let errorOutput = '';

    child.stderr.on('data', (data) => { errorOutput += data.toString(); });
    child.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`yt-dlp failed with exit code ${code}: ${errorOutput}`));
      }
      resolve();
    });
  });
});

Then('the download process should complete successfully', function () {
  const files = fs.readdirSync(this.testFolder);
  const infoJsonFile = files.find(f => f.endsWith('.info.json'));
  assert.ok(infoJsonFile, 'A .info.json metadata file must be created');

  const rawInfo = fs.readFileSync(path.join(this.testFolder, infoJsonFile), 'utf-8');
  this.metadata = JSON.parse(rawInfo);
  assert.ok(this.metadata.title, 'Video metadata must include a valid title');
});

Then('the video title {string} should be extracted', function (expectedKeyword) {
  assert.ok(
    this.metadata.title.toLowerCase().includes(expectedKeyword.toLowerCase()),
    `Expected title "${this.metadata.title}" to include "${expectedKeyword}"`
  );
});

Then('the video file should exist on disk', function () {
  const files = fs.readdirSync(this.testFolder);
  const videoFile = files.find(f => f.endsWith('.mp4') || f.endsWith('.mkv') || f.endsWith('.webm'));
  assert.ok(videoFile, 'Downloaded video file (.mp4/.mkv/.webm) must exist on disk');
  const stats = fs.statSync(path.join(this.testFolder, videoFile));
  assert.ok(stats.size > 0, 'Video file size must be greater than 0 bytes');
});

Then('the thumbnail image should be generated', function () {
  const files = fs.readdirSync(this.testFolder);
  const thumbFile = files.find(f => f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.webp'));
  assert.ok(thumbFile, 'Thumbnail image file must exist');
});

Then('top comments should be structured with timestamps', function () {
  assert.ok(Array.isArray(this.metadata.comments), 'Metadata comments must be an array');
  assert.ok(this.metadata.comments.length > 0, 'Extracted comments count must be greater than 0');
});
