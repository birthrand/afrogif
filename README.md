# AfroGIF - Mobile-First Reddit Media Browser

A mobile-first web application that scrapes and displays Reddit media content with infinite scroll, search, and category browsing.

## 🚀 Features

- **Mobile-First Design**: Optimized for mobile devices with responsive UI
- **Infinite Scroll**: Automatically loads more content as you scroll
- **Search Functionality**: Search across all Reddit content
- **Category Browsing**: Browse popular subreddits
- **Random Content**: Load random subreddits and content on each page load
- **Media Modal**: Full-screen media viewer with keyboard navigation
- **Video Support**: Enhanced video playback with mobile compatibility
- **Keyboard Shortcuts**: 
  - `R` - Load random content
  - `Escape` - Close modal/sidebar
  - Arrow keys or `WASD` - Navigate media modal

## 📱 Mobile Access

### From Your Computer
- **Local**: `http://localhost:3000`

### From Your Phone
1. **Find your computer's IP address**:
   ```bash
   ipconfig
   ```
   Look for "IPv4 Address" (e.g., `172.20.10.4`)

2. **On your phone**:
   - Connect to the same WiFi as your computer
   - Open browser
   - Go to: `http://172.20.10.4:3000`

## 🛠️ Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the server**:
   ```bash
   npm start
   ```

3. **Access the app**:
   - Computer: `http://localhost:3000`
   - Phone: `http://YOUR_COMPUTER_IP:3000`

## 🔧 Troubleshooting

### Port 3000 Already in Use
```bash
# Kill existing Node.js processes
Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force

# Then restart
npm start
```

### Videos Not Loading on Mobile
- The app includes a video proxy to handle CORS issues
- If videos still don't load, use the "Open Video Directly" link
- Or click "View on Reddit" to open in the Reddit app

### Search Not Working
- Make sure you're typing in the search box
- Press Enter or click the search button
- Check browser console for any errors

## 🎯 Usage

1. **Browse Content**: Scroll through media content
2. **Search**: Click search icon and enter keywords
3. **Categories**: Open sidebar and select subreddits
4. **Random**: Click random button or press `R` key
5. **View Media**: Click on any media to open full-screen modal
6. **Navigate**: Use arrow keys or buttons in modal

## 🛡️ Security

- Content Security Policy (CSP) enabled
- CORS headers configured
- User-Agent spoofing for Reddit API access
- Input sanitization and validation

## 📊 API Endpoints

- `GET /api/popular-subreddits` - Get popular subreddit list
- `GET /api/subreddit/:subreddit` - Get subreddit media
- `GET /api/search` - Search Reddit content
- `GET /api/proxy/video` - Video proxy for mobile compatibility

## 🎨 Technologies

- **Backend**: Node.js, Express
- **Frontend**: Vanilla JavaScript, Tailwind CSS
- **APIs**: Reddit JSON API
- **Scraping**: Axios, Cheerio
- **Security**: Helmet, CORS

---

**Note**: This app scrapes Reddit content for educational purposes. Please respect Reddit's terms of service and rate limits. 