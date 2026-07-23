#!/usr/bin/env python3
"""
LocalTube Backend yt-dlp CLI Downloader & Ingestion Script
SRS Version: 1.1.0
"""

import sys
import os
import json
import subprocess
import sqlite3

DOWNLOAD_DIR = os.path.expanduser("~/Videos/LocalTubeDownloads")

def ensure_download_dir():
    if not os.path.exists(DOWNLOAD_DIR):
        os.makedirs(DOWNLOAD_DIR, exist_ok=True)

def download_youtube_url(url):
    ensure_download_dir()
    print(f"[*] Starting download for: {url}")
    print(f"[*] Target Directory: {DOWNLOAD_DIR}")

    # SRS v1.1.0 yt-dlp CLI Command
    cmd = [
        "yt-dlp",
        "--format", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
        "--write-thumbnail",
        "--convert-thumbnails", "jpg",
        "--write-info-json",
        "--write-comments",
        "--output", f"{DOWNLOAD_DIR}/%(id)s/%(title)s.%(ext)s",
        url
    ]

    try:
        res = subprocess.run(cmd, check=True, capture_output=True, text=True)
        print("[+] Download complete!")
        print(res.stdout)
    except subprocess.CalledProcessError as e:
        print(f"[-] Download failed: {e.stderr}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 downloader.py <YOUTUBE_URL>")
        sys.exit(1)
    
    url_arg = sys.argv[1]
    download_youtube_url(url_arg)
