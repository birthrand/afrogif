const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Log environment info
console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔧 Port: ${PORT}`);

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      mediaSrc: ["'self'", "https:", "blob:"],
      connectSrc: ["'self'", "https://www.reddit.com", "https://reddit.com"]
    }
  }
}));
app.use(compression());
// CORS configuration for production
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://afrogif.onrender.com', 'https://your-app-name.onrender.com']
    : true,
  credentials: true
}));
app.use(express.json());
// Serve static files
app.use(express.static('public'));

// User agent to avoid being blocked
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

// Reddit API functions
async function scrapeRedditMedia(subreddit, sort = 'hot', limit = 25) {
  try {
    console.log(`Scraping Reddit: r/${subreddit} (${sort})`);
    const url = `https://www.reddit.com/r/${subreddit}/${sort}.json?limit=${limit}`;
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      },
      timeout: 10000 // Reduced timeout for faster fallback
    });

    const posts = response.data.data.children
      .map(child => child.data)
      .filter(post => {
        // Filter for media content
        return (
          post.is_video ||
          post.post_hint === 'image' ||
          post.post_hint === 'rich:video' ||
          post.url.includes('.gif') ||
          post.url.includes('.mp4') ||
          post.url.includes('.webm') ||
          post.url.includes('imgur.com') ||
          post.url.includes('gfycat.com') ||
          post.url.includes('redgifs.com') ||
          post.url.includes('v.redd.it')
        );
      })
      .map(post => {
        let mediaUrl = post.url;
        let mediaType = 'image';
        let thumbnail = post.thumbnail;

        // Handle different media types
        if (post.is_video && post.media && post.media.reddit_video) {
          mediaUrl = post.media.reddit_video.fallback_url;
          mediaType = 'video';
          thumbnail = post.thumbnail;
        } else if (post.post_hint === 'rich:video' && post.media && post.media.oembed) {
          mediaUrl = post.media.oembed.url;
          mediaType = 'video';
          thumbnail = post.media.oembed.thumbnail_url;
        } else if (post.url.includes('imgur.com')) {
          // Convert imgur links to direct image links
          if (post.url.includes('/a/')) {
            // Album - we'll skip for now
            return null;
          } else {
            mediaUrl = post.url.replace(/\.gifv$/, '.gif');
            mediaType = post.url.includes('.gif') ? 'gif' : 'image';
          }
        } else if (post.url.includes('gfycat.com')) {
          mediaType = 'gif';
        } else if (post.url.includes('redgifs.com')) {
          mediaType = 'video';
        }

        return {
          id: post.id,
          title: post.title,
          author: post.author,
          subreddit: post.subreddit,
          url: mediaUrl,
          thumbnail: thumbnail,
          mediaType: mediaType,
          score: post.score,
          numComments: post.num_comments,
          created: post.created_utc,
          permalink: `https://reddit.com${post.permalink}`,
          isNSFW: post.over_18,
          domain: post.domain
        };
      })
      .filter(post => post !== null);

    return posts;
  } catch (error) {
    console.error('Error scraping Reddit:', error.message);
    throw new Error('Failed to fetch Reddit content');
  }
}

async function searchRedditMedia(query, sort = 'relevance', limit = 25) {
  try {
    const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=${sort}&limit=${limit}&type=link`;
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      },
      timeout: 15000
    });

    const posts = response.data.data.children
      .map(child => child.data)
      .filter(post => {
        return (
          post.is_video ||
          post.post_hint === 'image' ||
          post.post_hint === 'rich:video' ||
          post.url.includes('.gif') ||
          post.url.includes('.mp4') ||
          post.url.includes('.webm') ||
          post.url.includes('imgur.com') ||
          post.url.includes('gfycat.com') ||
          post.url.includes('redgifs.com') ||
          post.url.includes('v.redd.it')
        );
      })
      .map(post => {
        let mediaUrl = post.url;
        let mediaType = 'image';
        let thumbnail = post.thumbnail;

        if (post.is_video && post.media && post.media.reddit_video) {
          mediaUrl = post.media.reddit_video.fallback_url;
          mediaType = 'video';
        } else if (post.url.includes('imgur.com')) {
          mediaUrl = post.url.replace(/\.gifv$/, '.gif');
          mediaType = post.url.includes('.gif') ? 'gif' : 'image';
        }

        return {
          id: post.id,
          title: post.title,
          author: post.author,
          subreddit: post.subreddit,
          url: mediaUrl,
          thumbnail: thumbnail,
          mediaType: mediaType,
          score: post.score,
          numComments: post.num_comments,
          created: post.created_utc,
          permalink: `https://reddit.com${post.permalink}`,
          isNSFW: post.over_18,
          domain: post.domain
        };
      })
      .filter(post => post !== null);

    return posts;
  } catch (error) {
    console.error('Error searching Reddit:', error.message);
    throw new Error('Failed to search Reddit content');
  }
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'AfroGIF server is running!',
    environment: process.env.NODE_ENV || 'development',
    port: PORT
  });
});

app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    data: [
      {
        id: 'test1',
        title: 'Test Content - Server is Working!',
        author: 'system',
        subreddit: 'test',
        url: 'https://via.placeholder.com/400x300/00ff00/ffffff?text=Server+Working',
        thumbnail: 'https://via.placeholder.com/150x150/00ff00/ffffff?text=✅',
        mediaType: 'image',
        score: 100,
        numComments: 0,
        created: Date.now() / 1000,
        permalink: 'https://example.com',
        isNSFW: false,
        domain: 'test.com'
      }
    ],
    message: 'Test endpoint working correctly'
  });
});

app.get('/api/popular-subreddits', (req, res) => {
  const popularSubreddits = [
    'funny', 'gifs', 'aww', 'pics', 'videos', 'memes', 'gaming',
    'sports', 'food', 'art', 'music', 'movies', 'television',
    'animals', 'nature', 'space', 'science', 'technology'
  ];
  res.json(popularSubreddits);
});

app.get('/api/subreddit/:subreddit', async (req, res) => {
  try {
    const { subreddit } = req.params;
    const { sort = 'hot', limit = 25 } = req.query;
    
    const posts = await scrapeRedditMedia(subreddit, sort, parseInt(limit));
    res.json({ success: true, data: posts });
  } catch (error) {
    console.error(`Error fetching subreddit ${subreddit}:`, error.message);
    
    // Return fallback content instead of error
    const fallbackPosts = [
      {
        id: 'fallback1',
        title: '🎬 Welcome to AfroGIF!',
        author: 'system',
        subreddit: subreddit,
        url: 'https://via.placeholder.com/400x300/ff6b35/ffffff?text=Welcome+to+AfroGIF',
        thumbnail: 'https://via.placeholder.com/150x150/ff6b35/ffffff?text=🎬',
        mediaType: 'image',
        score: 100,
        numComments: 0,
        created: Date.now() / 1000,
        permalink: `https://reddit.com/r/${subreddit}`,
        isNSFW: false,
        domain: 'placeholder.com'
      },
      {
        id: 'fallback2',
        title: 'Reddit is temporarily unavailable',
        author: 'system',
        subreddit: subreddit,
        url: 'https://via.placeholder.com/400x300/4a90e2/ffffff?text=Reddit+Unavailable',
        thumbnail: 'https://via.placeholder.com/150x150/4a90e2/ffffff?text=⏰',
        mediaType: 'image',
        score: 50,
        numComments: 0,
        created: Date.now() / 1000,
        permalink: `https://reddit.com/r/${subreddit}`,
        isNSFW: false,
        domain: 'placeholder.com'
      },
      {
        id: 'fallback3',
        title: 'Try searching or browse categories',
        author: 'system',
        subreddit: subreddit,
        url: 'https://via.placeholder.com/400x300/00ff00/ffffff?text=Try+Searching',
        thumbnail: 'https://via.placeholder.com/150x150/00ff00/ffffff?text=🔍',
        mediaType: 'image',
        score: 25,
        numComments: 0,
        created: Date.now() / 1000,
        permalink: `https://reddit.com/r/${subreddit}`,
        isNSFW: false,
        domain: 'placeholder.com'
      }
    ];
    
    res.json({ success: true, data: fallbackPosts, fallback: true });
  }
});

app.get('/api/search', async (req, res) => {
  try {
    const { q, sort = 'relevance', limit = 25 } = req.query;
    
    if (!q) {
      return res.status(400).json({ success: false, error: 'Query parameter is required' });
    }
    
    const posts = await searchRedditMedia(q, sort, parseInt(limit));
    res.json({ success: true, data: posts });
  } catch (error) {
    console.error(`Error searching for "${q}":`, error.message);
    
    // Return fallback content for search
    const fallbackPosts = [
      {
        id: 'search-fallback1',
        title: `Search for "${q}" failed`,
        author: 'system',
        subreddit: 'search',
        url: 'https://via.placeholder.com/400x300/ff6b35/ffffff?text=Search+Failed',
        thumbnail: 'https://via.placeholder.com/150x150/ff6b35/ffffff?text=🔍',
        mediaType: 'image',
        score: 0,
        numComments: 0,
        created: Date.now() / 1000,
        permalink: `https://reddit.com/search?q=${encodeURIComponent(q)}`,
        isNSFW: false,
        domain: 'placeholder.com'
      }
    ];
    
    res.json({ success: true, data: fallbackPosts, fallback: true });
  }
});

// Video proxy endpoint to handle CORS issues
app.get('/api/proxy/video', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ success: false, error: 'URL parameter is required' });
    }
    
    const response = await axios.get(url, {
      responseType: 'stream',
      headers: {
        'User-Agent': USER_AGENT,
        'Referer': 'https://www.reddit.com/'
      },
      timeout: 15000
    });
    
    // Set appropriate headers for video streaming
    res.setHeader('Content-Type', response.headers['content-type'] || 'video/mp4');
    res.setHeader('Content-Length', response.headers['content-length'] || '');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    // Pipe the video stream to the response
    response.data.pipe(res);
  } catch (error) {
    console.error('Error proxying video:', error.message);
    res.status(500).json({ success: false, error: 'Failed to proxy video' });
  }
});

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve CSS with explicit error handling
app.get('/styles.css', (req, res) => {
  const cssPath = path.join(__dirname, 'public', 'styles.css');
  
  // Check if file exists
  if (!require('fs').existsSync(cssPath)) {
    console.error('CSS file not found:', cssPath);
    return res.status(404).json({ error: 'CSS file not found' });
  }
  
  res.setHeader('Content-Type', 'text/css');
  res.sendFile(cssPath, (err) => {
    if (err) {
      console.error('Error serving CSS:', err);
      res.status(500).json({ error: 'Failed to serve CSS file' });
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📱 Mobile-first Reddit media scraper ready!`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔧 Port: ${PORT}`);
});

// Handle server errors
server.on('error', (err) => {
  console.error('Server error:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
}); 