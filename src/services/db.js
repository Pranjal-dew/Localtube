/**
 * LocalTube SQLite Database Core & FTS5 Search Engine
 * SRS Version: 1.1.0
 */

const STORAGE_KEYS = {
  VIDEOS: 'localtube_videos_v1',
  COMMENTS: 'localtube_comments_v1',
  COLLECTIONS: 'localtube_collections_v1',
  COLLECTION_ITEMS: 'localtube_collection_items_v1',
  SEARCH_INDEX: 'localtube_search_index_v1',
  SETTINGS: 'localtube_settings_v1'
};

const DEFAULT_SETTINGS = {
  maxTopComments: 100,
  maxSubComments: 20,
  maxNestedSubComments: 10,
  downloadQuality: 'best',
  autoSavePlayback: true,
  themeMode: 'dark',
  cookiesFromBrowser: 'none', // 'chrome' | 'firefox' | 'brave' | 'edge' | 'none'
  downloadDirectory: '~/Videos/LocalTubeDownloads'
};

// Seed dataset replicating yt-dlp extracted videos & comments
const DEFAULT_VIDEOS = [
  {
    id: "dQw4w9WgXcQ",
    file_path: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    thumbnail_path: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
    title: "Big Buck Bunny - 4K Offline Remastered Edition",
    channel_name: "Blender Foundation",
    duration_sec: 596,
    last_position_sec: 145,
    completion_percent: 24.3,
    last_watched_at: new Date(Date.now() - 3600000).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    chapters: [
      { title: "Intro & Sunrise", start_time: 0, end_time: 45 },
      { title: "Forest Animals Awaken", start_time: 45, end_time: 150 },
      { title: "The Apple Trick", start_time: 150, end_time: 300 },
      { title: "Bunny Strikes Back", start_time: 300, end_time: 480 },
      { title: "Grand Finale & Credits", start_time: 480, end_time: 596 }
    ]
  },
  {
    id: "fJ9rUzIMcZQ",
    file_path: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    thumbnail_path: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80",
    title: "Elephants Dream - Open Source Computer Graphics Landmark",
    channel_name: "Orange Open Movie Project",
    duration_sec: 653,
    last_position_sec: 420,
    completion_percent: 64.3,
    last_watched_at: new Date(Date.now() - 86400000).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    chapters: [
      { title: "The Machine Room", start_time: 0, end_time: 120 },
      { title: "Cable Network Tour", start_time: 120, end_time: 320 },
      { title: "Elevator Shaft Scene", start_time: 320, end_time: 500 },
      { title: "The Great Explosion", start_time: 500, end_time: 653 }
    ]
  },
  {
    id: "L_LUpnjgPso",
    file_path: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    thumbnail_path: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
    title: "For Bigger Blazes - Tech Deep Dive & Hardware Overview",
    channel_name: "Tech Specs Lab",
    duration_sec: 15,
    last_position_sec: 12,
    completion_percent: 80.0,
    last_watched_at: new Date(Date.now() - 7200000).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    chapters: [
      { title: "Specs Teaser", start_time: 0, end_time: 7 },
      { title: "Hardware Conclusion", start_time: 7, end_time: 15 }
    ]
  }
];

const DEFAULT_COMMENTS = [
  // Public YouTube Top Comments (is_local = 0) with Likes & Thread Replies
  {
    id: 1,
    video_id: "dQw4w9WgXcQ",
    author: "@tech_enthusiast99",
    content: "The opening sequence lighting effect is absolutely breathtaking! The rendering pipeline details are insane at 0:45.",
    timestamp_sec: 45,
    is_local: 0,
    likes_count: 1420,
    parent_id: null,
    created_at: "2026-07-20T10:00:00Z"
  },
  {
    id: 101,
    video_id: "dQw4w9WgXcQ",
    author: "@shader_guru",
    content: "Agreed! That volumetric raymarching pass was rendered using early Blender Cycles GPU acceleration.",
    timestamp_sec: null,
    is_local: 0,
    likes_count: 312,
    parent_id: 1,
    created_at: "2026-07-20T10:15:00Z"
  },
  {
    id: 102,
    video_id: "dQw4w9WgXcQ",
    author: "@vfx_student",
    content: "Is there a tutorial anywhere explaining how they calculated sub-surface scattering for the grass?",
    timestamp_sec: null,
    is_local: 0,
    likes_count: 45,
    parent_id: 1,
    created_at: "2026-07-20T11:00:00Z"
  },
  {
    id: 1021,
    video_id: "dQw4w9WgXcQ",
    author: "@shader_guru",
    content: "Check out the official Blender open movie production files! The blend files are available under CC-BY.",
    timestamp_sec: null,
    is_local: 0,
    likes_count: 19,
    parent_id: 102,
    created_at: "2026-07-20T11:30:00Z"
  },
  {
    id: 2,
    video_id: "dQw4w9WgXcQ",
    author: "@cg_artist_pro",
    content: "Notice how the fur simulation responds to wind forces right at 2:15. Masterpiece work.",
    timestamp_sec: 135,
    is_local: 0,
    likes_count: 890,
    parent_id: null,
    created_at: "2026-07-20T11:30:00Z"
  },
  {
    id: 201,
    video_id: "dQw4w9WgXcQ",
    author: "@animator_dan",
    content: "The hair dynamics node system took almost 3 months to develop back in 2008!",
    timestamp_sec: null,
    is_local: 0,
    likes_count: 140,
    parent_id: 2,
    created_at: "2026-07-20T12:00:00Z"
  },
  {
    id: 3,
    video_id: "dQw4w9WgXcQ",
    author: "@filmmaker_joe",
    content: "Check out the camera panning transition at 4:30. Brilliant visual storytelling technique.",
    timestamp_sec: 270,
    is_local: 0,
    likes_count: 530,
    parent_id: null,
    created_at: "2026-07-21T09:15:00Z"
  },

  // Personal Notes (is_local = 1)
  {
    id: 4,
    video_id: "dQw4w9WgXcQ",
    author: "Me",
    content: "**Note to self**: Study the volumetric fog shader implementation at 1:30. Replicate in Three.js shader.",
    timestamp_sec: 90,
    is_local: 1,
    likes_count: 0,
    parent_id: null,
    created_at: "2026-07-22T14:20:00Z"
  },
  {
    id: 5,
    video_id: "dQw4w9WgXcQ",
    author: "Me",
    content: "**Bookmark**: Key animation benchmark for frame rate drop comparison tests.",
    timestamp_sec: 200,
    is_local: 1,
    likes_count: 0,
    parent_id: null,
    created_at: "2026-07-23T11:05:00Z"
  },
  {
    id: 6,
    video_id: "fJ9rUzIMcZQ",
    author: "@blender_fanatic",
    content: "The machine voice breakdown is pure nostalgia at 1:20. Open source history right here!",
    timestamp_sec: 80,
    is_local: 0,
    likes_count: 670,
    parent_id: null,
    created_at: "2026-07-19T08:00:00Z"
  },
  {
    id: 7,
    video_id: "fJ9rUzIMcZQ",
    author: "Me",
    content: "Architecture reference for cable rigging dynamics.",
    timestamp_sec: 310,
    is_local: 1,
    likes_count: 0,
    parent_id: null,
    created_at: "2026-07-22T18:40:00Z"
  }
];

const DEFAULT_COLLECTIONS = [
  { id: 1, name: "3D Graphics & Blender", description: "Open source CGI references and benchmarks", created_at: "2026-07-01T00:00:00Z" },
  { id: 2, name: "Tech Studies", description: "Hardware & engineering deep dives", created_at: "2026-07-05T00:00:00Z" }
];

const DEFAULT_COLLECTION_ITEMS = [
  { collection_id: 1, video_id: "dQw4w9WgXcQ", item_order: 1 },
  { collection_id: 1, video_id: "fJ9rUzIMcZQ", item_order: 2 },
  { collection_id: 2, video_id: "L_LUpnjgPso", item_order: 1 }
];

class LocalTubeDatabase {
  constructor() {
    this.initDatabase();
  }

  initDatabase() {
    if (!localStorage.getItem(STORAGE_KEYS.VIDEOS)) {
      localStorage.setItem(STORAGE_KEYS.VIDEOS, JSON.stringify(DEFAULT_VIDEOS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.COMMENTS)) {
      localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(DEFAULT_COMMENTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.COLLECTIONS)) {
      localStorage.setItem(STORAGE_KEYS.COLLECTIONS, JSON.stringify(DEFAULT_COLLECTIONS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.COLLECTION_ITEMS)) {
      localStorage.setItem(STORAGE_KEYS.COLLECTION_ITEMS, JSON.stringify(DEFAULT_COLLECTION_ITEMS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    }
    this.rebuildFTSIndex();
  }

  // Settings CRUD
  getSettings() {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  }

  updateSettings(newSettings) {
    const current = this.getSettings();
    const updated = { ...current, ...newSettings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    return updated;
  }

  // Rebuild SQLite FTS5 Virtual Index
  rebuildFTSIndex() {
    const videos = this.getVideos();
    const comments = this.getComments();
    
    const ftsIndex = [];
    videos.forEach(v => {
      ftsIndex.push({
        type: 'video',
        video_id: v.id,
        title: v.title,
        comment_content: v.channel_name,
        timestamp_sec: 0
      });
    });

    comments.forEach(c => {
      const v = videos.find(vid => vid.id === c.video_id);
      ftsIndex.push({
        type: 'comment',
        video_id: c.video_id,
        title: v ? v.title : '',
        comment_content: c.content,
        author: c.author,
        timestamp_sec: c.timestamp_sec,
        is_local: c.is_local
      });
    });

    localStorage.setItem(STORAGE_KEYS.SEARCH_INDEX, JSON.stringify(ftsIndex));
  }

  // Videos CRUD
  getVideos() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.VIDEOS) || '[]');
  }

  getVideoById(id) {
    const videos = this.getVideos();
    return videos.find(v => v.id === id) || null;
  }

  insertVideo(videoData) {
    const videos = this.getVideos();
    const existingIndex = videos.findIndex(v => v.id === videoData.id);
    if (existingIndex >= 0) {
      videos[existingIndex] = { ...videos[existingIndex], ...videoData };
    } else {
      videos.unshift({
        ...videoData,
        last_position_sec: 0,
        completion_percent: 0.0,
        last_watched_at: null,
        created_at: new Date().toISOString()
      });
    }
    localStorage.setItem(STORAGE_KEYS.VIDEOS, JSON.stringify(videos));
    this.rebuildFTSIndex();
    return videoData;
  }

  updateVideo(videoId, updatedFields) {
    const videos = this.getVideos();
    const index = videos.findIndex(v => v.id === videoId);
    if (index >= 0) {
      videos[index] = { ...videos[index], ...updatedFields };
      localStorage.setItem(STORAGE_KEYS.VIDEOS, JSON.stringify(videos));
      this.rebuildFTSIndex();
      return videos[index];
    }
    return null;
  }

  updatePlaybackState(videoId, positionSec, durationSec) {
    const videos = this.getVideos();
    const videoIndex = videos.findIndex(v => v.id === videoId);
    if (videoIndex >= 0) {
      const dur = durationSec || videos[videoIndex].duration_sec || 1;
      const completion = Math.min(100, (positionSec / dur) * 100);
      videos[videoIndex].last_position_sec = Math.floor(positionSec);
      videos[videoIndex].completion_percent = parseFloat(completion.toFixed(1));
      videos[videoIndex].last_watched_at = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.VIDEOS, JSON.stringify(videos));
    }
  }

  deleteVideo(id) {
    let videos = this.getVideos();
    videos = videos.filter(v => v.id !== id);
    localStorage.setItem(STORAGE_KEYS.VIDEOS, JSON.stringify(videos));
    
    // Cascade delete comments
    let comments = this.getComments();
    comments = comments.filter(c => c.video_id !== id);
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(comments));

    this.rebuildFTSIndex();
  }

  // Comments & Notes (Dual-Layer)
  getComments(videoId = null) {
    const comments = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMMENTS) || '[]');
    if (videoId) {
      return comments.filter(c => c.video_id === videoId).sort((a, b) => (a.timestamp_sec || 0) - (b.timestamp_sec || 0));
    }
    return comments;
  }

  insertComment(commentData) {
    const comments = this.getComments();
    const newComment = {
      id: Date.now(),
      created_at: new Date().toISOString(),
      ...commentData
    };
    comments.push(newComment);
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(comments));
    this.rebuildFTSIndex();
    return newComment;
  }

  deleteComment(commentId) {
    let comments = this.getComments();
    comments = comments.filter(c => c.id !== commentId);
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(comments));
    this.rebuildFTSIndex();
  }

  replacePublicComments(videoId, newPublicComments) {
    let comments = this.getComments();
    // Keep local personal notes (is_local = 1) and other videos' comments
    comments = comments.filter(c => c.video_id !== videoId || c.is_local === 1);
    comments.push(...newPublicComments);
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(comments));
    this.rebuildFTSIndex();
    return newPublicComments;
  }

  // Collections (Playlists)
  getCollections() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.COLLECTIONS) || '[]');
  }

  createCollection(name, description = '') {
    const collections = this.getCollections();
    const newCol = {
      id: Date.now(),
      name,
      description,
      created_at: new Date().toISOString()
    };
    collections.push(newCol);
    localStorage.setItem(STORAGE_KEYS.COLLECTIONS, JSON.stringify(collections));
    return newCol;
  }

  updateCollection(collectionId, name, description) {
    const collections = this.getCollections();
    const index = collections.findIndex(c => c.id === collectionId);
    if (index >= 0) {
      collections[index].name = name;
      collections[index].description = description;
      localStorage.setItem(STORAGE_KEYS.COLLECTIONS, JSON.stringify(collections));
    }
  }

  deleteCollection(collectionId) {
    let collections = this.getCollections();
    collections = collections.filter(c => c.id !== collectionId);
    localStorage.setItem(STORAGE_KEYS.COLLECTIONS, JSON.stringify(collections));

    let items = JSON.parse(localStorage.getItem(STORAGE_KEYS.COLLECTION_ITEMS) || '[]');
    items = items.filter(i => i.collection_id !== collectionId);
    localStorage.setItem(STORAGE_KEYS.COLLECTION_ITEMS, JSON.stringify(items));
  }

  getCollectionItems(collectionId) {
    const items = JSON.parse(localStorage.getItem(STORAGE_KEYS.COLLECTION_ITEMS) || '[]');
    const filtered = items.filter(item => item.collection_id === collectionId);
    const videos = this.getVideos();
    return filtered.map(item => ({
      ...item,
      video: videos.find(v => v.id === item.video_id)
    })).filter(item => item.video);
  }

  addVideoToCollection(collectionId, videoId) {
    const items = JSON.parse(localStorage.getItem(STORAGE_KEYS.COLLECTION_ITEMS) || '[]');
    if (!items.some(i => i.collection_id === collectionId && i.video_id === videoId)) {
      items.push({
        collection_id: collectionId,
        video_id: videoId,
        item_order: items.length + 1
      });
      localStorage.setItem(STORAGE_KEYS.COLLECTION_ITEMS, JSON.stringify(items));
    }
  }

  removeVideoFromCollection(collectionId, videoId) {
    let items = JSON.parse(localStorage.getItem(STORAGE_KEYS.COLLECTION_ITEMS) || '[]');
    items = items.filter(i => !(i.collection_id === collectionId && i.video_id === videoId));
    localStorage.setItem(STORAGE_KEYS.COLLECTION_ITEMS, JSON.stringify(items));
  }

  // FTS5 Search Engine Query Emulation
  searchFTS5(query) {
    if (!query || !query.trim()) return [];
    const q = query.toLowerCase().trim();
    const index = JSON.parse(localStorage.getItem(STORAGE_KEYS.SEARCH_INDEX) || '[]');
    const videos = this.getVideos();

    return index.filter(item => {
      const titleMatch = item.title && item.title.toLowerCase().includes(q);
      const contentMatch = item.comment_content && item.comment_content.toLowerCase().includes(q);
      const authorMatch = item.author && item.author.toLowerCase().includes(q);
      return titleMatch || contentMatch || authorMatch;
    }).map(item => {
      const video = videos.find(v => v.id === item.video_id);
      return {
        ...item,
        video
      };
    }).filter(item => item.video);
  }
}

export const db = new LocalTubeDatabase();
