class AfroGIF {
    constructor() {
        this.currentSubreddit = this.getRandomSubreddit();
        this.currentSearch = '';
        this.currentSort = this.getRandomSort();
        this.currentLimit = 25;
        this.posts = [];
        this.isLoading = false;
        this.currentModalIndex = 0; // Track current modal position
        
        this.init();
    }

    getRandomSubreddit() {
        const subreddits = [
            'funny', 'gifs', 'aww', 'pics', 'videos', 'memes', 'gaming',
            'sports', 'food', 'art', 'music', 'movies', 'television',
            'animals', 'nature', 'space', 'science', 'technology',
            'oddlysatisfying', 'interestingasfuck', 'nextfuckinglevel',
            'beamazed', 'damnthatsinteresting', 'woahdude', 'blackmagicfuckery'
        ];
        return subreddits[Math.floor(Math.random() * subreddits.length)];
    }

    getRandomSort() {
        const sorts = ['hot', 'new', 'top', 'rising'];
        return sorts[Math.floor(Math.random() * sorts.length)];
    }

    async loadRandomContent() {
        console.log('🎲 Loading random content...');
        this.currentSubreddit = this.getRandomSubreddit();
        this.currentSort = this.getRandomSort();
        this.currentSearch = '';
        this.currentLimit = 25;
        this.posts = [];
        
        console.log(`🎲 New random content: r/${this.currentSubreddit} (${this.currentSort})`);
        this.updateCurrentSubredditDisplay();
        await this.loadContent();
    }

    async init() {
        console.log(`🎲 Loading random content: r/${this.currentSubreddit} (${this.currentSort})`);
        this.bindEvents();
        await this.loadPopularSubreddits();
        this.updateCurrentSubredditDisplay();
        await this.loadContent();
    }

    bindEvents() {
        // Search functionality
        const searchToggle = document.getElementById('searchToggle');
        const searchBtn = document.getElementById('searchBtn');
        const searchInput = document.getElementById('searchInput');
        
        console.log('Search elements found:', {
            searchToggle: !!searchToggle,
            searchBtn: !!searchBtn,
            searchInput: !!searchInput
        });
        
        searchToggle.addEventListener('click', () => {
            console.log('Search toggle clicked');
            this.toggleSearch();
        });

        searchBtn.addEventListener('click', (e) => {
            console.log('Search button clicked', e);
            e.preventDefault();
            e.stopPropagation();
            this.performSearch();
        });

        // Add visual feedback for debugging
        searchBtn.addEventListener('mouseenter', () => {
            console.log('Search button hovered');
            searchBtn.style.backgroundColor = '#ff6b35';
        });

        searchBtn.addEventListener('mouseleave', () => {
            console.log('Search button left');
            searchBtn.style.backgroundColor = '';
        });

        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                console.log('Enter key pressed in search input');
                this.performSearch();
            }
        });

        searchInput.addEventListener('click', (e) => {
            console.log('Search input clicked', e);
        });

        // Sidebar functionality
        document.getElementById('menuToggle').addEventListener('click', () => {
            this.openSidebar();
        });

        document.getElementById('closeSidebar').addEventListener('click', () => {
            this.closeSidebar();
        });

        document.getElementById('overlay').addEventListener('click', () => {
            this.closeSidebar();
        });

        // Random content functionality
        document.getElementById('randomBtn').addEventListener('click', () => {
            this.loadRandomContent();
            this.closeSidebar();
        });

        // Modal functionality
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('mediaModal').addEventListener('click', (e) => {
            if (e.target.id === 'mediaModal') {
                this.closeModal();
            }
        });

        // Navigation buttons
        document.getElementById('prevButton').addEventListener('click', () => {
            this.navigateModal('prev');
        });

        document.getElementById('nextButton').addEventListener('click', () => {
            this.navigateModal('next');
        });

        // Load more functionality
        document.getElementById('loadMoreBtn').addEventListener('click', () => {
            this.loadMore();
        });

        // Retry functionality
        document.getElementById('retryBtn').addEventListener('click', () => {
            this.loadContent();
        });

        // Infinite scroll functionality
        this.setupInfiniteScroll();

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
                this.closeSidebar();
            } else if (e.key === 'r' || e.key === 'R') {
                this.loadRandomContent();
            } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                this.navigateModal('prev');
            } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                this.navigateModal('next');
            } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
                this.scrollModal('up');
            } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
                this.scrollModal('down');
            }
        });
    }

    async loadPopularSubreddits() {
        try {
            const response = await fetch('/api/popular-subreddits');
            const subreddits = await response.json();
            
            const container = document.getElementById('popularSubreddits');
            container.innerHTML = subreddits.map(subreddit => `
                <button 
                    class="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors text-text-primary"
                    data-subreddit="${subreddit}"
                >
                    r/${subreddit}
                </button>
            `).join('');

            // Add click events to subreddit buttons
            container.querySelectorAll('button').forEach(button => {
                button.addEventListener('click', () => {
                    const subreddit = button.dataset.subreddit;
                    this.loadSubreddit(subreddit);
                    this.closeSidebar();
                });
            });
        } catch (error) {
            console.error('Failed to load popular subreddits:', error);
        }
    }

    async loadContent() {
        // Only show loading on initial load, not for infinite scroll
        if (this.posts.length === 0) {
            this.showLoading();
            this.hideError();
            this.hideEmpty();
        }

        try {
            this.isLoading = true;
            
            if (this.currentSearch) {
                await this.searchContent();
            } else if (this.currentSubreddit) {
                await this.loadSubredditContent();
            } else {
                // Default to funny subreddit if nothing is selected
                this.currentSubreddit = 'funny';
                await this.loadSubredditContent();
            }
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.hideLoading();
            this.isLoading = false;
        }
    }

    async loadSubredditContent() {
        const response = await fetch(`/api/subreddit/${this.currentSubreddit}?sort=${this.currentSort}&limit=${this.currentLimit}`);
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error);
        }

        // For new subreddit loads, always replace posts
        // For infinite scroll, append new posts
        if (this.posts.length === 0 || this.currentLimit <= 25) {
            this.posts = result.data;
        } else {
            // Append only new posts (avoid duplicates) - for infinite scroll
            const newPosts = result.data.filter(newPost => 
                !this.posts.some(existingPost => existingPost.id === newPost.id)
            );
            this.posts = [...this.posts, ...newPosts];
        }
        
        // Show fallback message if using fallback content
        if (result.fallback) {
            this.showToast('Reddit is temporarily unavailable. Showing fallback content.', 'warning');
        }
        
        this.renderContent();
    }

    async searchContent() {
        console.log('Searching for:', this.currentSearch);
        const url = `/api/search?q=${encodeURIComponent(this.currentSearch)}&sort=${this.currentSort}&limit=${this.currentLimit}`;
        console.log('Search URL:', url);
        
        const response = await fetch(url);
        const result = await response.json();
        
        console.log('Search result:', result);
        
        if (!result.success) {
            throw new Error(result.error);
        }

        console.log('Search data length:', result.data ? result.data.length : 'no data');
        console.log('First few search results:', result.data ? result.data.slice(0, 3) : 'no data');

        // For search, always replace posts with new results
        // For infinite scroll, append new posts
        if (this.currentSearch) {
            this.posts = result.data;
            console.log('Replaced posts with search results');
        } else if (this.posts.length === 0) {
            this.posts = result.data;
            console.log('Replaced posts with initial results');
        } else {
            // Append only new posts (avoid duplicates) - for infinite scroll
            const newPosts = result.data.filter(newPost => 
                !this.posts.some(existingPost => existingPost.id === newPost.id)
            );
            this.posts = [...this.posts, ...newPosts];
            console.log('Appended new posts from infinite scroll');
        }
        
        // Show fallback message if using fallback content
        if (result.fallback) {
            this.showToast('Search failed. Reddit is temporarily unavailable.', 'warning');
        }
        
        console.log('Posts after search:', this.posts.length);
        this.renderContent();
    }

    async loadSubreddit(subreddit) {
        console.log('Loading subreddit:', subreddit);
        this.currentSubreddit = subreddit;
        this.currentSearch = '';
        this.currentLimit = 25; // Reset limit for new subreddit
        this.posts = [];
        this.updateCurrentSubredditDisplay();
        await this.loadContent();
    }

    updateCurrentSubredditDisplay() {
        const display = document.getElementById('currentSubreddit');
        if (this.currentSearch) {
            display.textContent = `Search: "${this.currentSearch}"`;
        } else {
            display.textContent = `r/${this.currentSubreddit} (${this.currentSort})`;
        }
    }

    performSearch() {
        const query = document.getElementById('searchInput').value.trim();
        console.log('Search input value:', query);
        
        if (!query) {
            console.log('Empty query, returning');
            return;
        }

        console.log('Performing search:', query);
        this.currentSearch = query;
        this.currentSubreddit = '';
        this.currentLimit = 25; // Reset limit for new search
        this.posts = [];
        this.updateCurrentSubredditDisplay();
        this.loadContent();
        this.toggleSearch();
    }

    setupInfiniteScroll() {
        // Throttle function to limit scroll events
        let ticking = false;
        
        const handleScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    this.checkInfiniteScroll();
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
    }

    checkInfiniteScroll() {
        // Check if user is near bottom of page
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        
        // Load more when user is within 200px of bottom
        if (scrollTop + windowHeight >= documentHeight - 200) {
            this.loadMore();
        }
    }

    async loadMore() {
        if (this.isLoading) return;

        // Show infinite scroll loading indicator
        document.getElementById('infiniteScrollLoading').classList.remove('hidden');
        
        this.currentLimit += 25;
        await this.loadContent();
        
        // Hide infinite scroll loading indicator
        document.getElementById('infiniteScrollLoading').classList.add('hidden');
    }

    renderContent() {
        console.log('renderContent called with', this.posts.length, 'posts');
        const grid = document.getElementById('contentGrid');
        
        if (this.posts.length === 0) {
            console.log('No posts, showing empty state');
            this.showEmpty();
            return;
        }

        // If this is the first load or we have fewer posts than the limit, replace the entire grid
        // This handles new searches and subreddit changes
        if (grid.children.length === 0 || this.posts.length <= this.currentLimit) {
            grid.innerHTML = this.posts.map(post => this.createMediaCard(post)).join('');
        } else {
            // For infinite scroll, append only the new posts
            const startIndex = Math.max(0, this.posts.length - 25);
            const newPosts = this.posts.slice(startIndex);
            const newCards = newPosts.map(post => this.createMediaCard(post)).join('');
            grid.insertAdjacentHTML('beforeend', newCards);
        }
        
        // Add click events to all media cards
        grid.querySelectorAll('.media-card').forEach((card, index) => {
            // Remove existing click listeners to avoid duplicates
            card.replaceWith(card.cloneNode(true));
        });
        
        // Re-add click events and image error handling
        grid.querySelectorAll('.media-card').forEach((card, index) => {
            card.addEventListener('click', () => {
                this.openMediaModal(this.posts[index], index);
            });
            
            // Handle image errors
            const img = card.querySelector('img');
            if (img) {
                img.addEventListener('error', () => {
                    const fallback = img.getAttribute('data-fallback');
                    if (fallback && img.src !== fallback) {
                        img.src = fallback;
                    }
                });
            }
        });

        // Hide load more button since we're using infinite scroll
        const loadMoreContainer = document.getElementById('loadMoreContainer');
        loadMoreContainer.classList.add('hidden');
    }

    createMediaCard(post) {
        const mediaType = this.getMediaType(post);
        const mediaIcon = this.getMediaIcon(mediaType);
        const thumbnail = post.thumbnail && post.thumbnail !== 'self' ? post.thumbnail : '/placeholder.svg';
        
        return `
            <div class="media-card cursor-pointer group" data-post-id="${post.id}">
                <div class="relative aspect-square overflow-hidden">
                    <img 
                        src="${thumbnail}" 
                        alt="${post.title}"
                        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        data-fallback="/placeholder.svg"
                    >
                    <div class="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1">
                        ${mediaIcon}
                    </div>
                    ${post.isNSFW ? '<div class="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">NSFW</div>' : ''}
                </div>
                <div class="p-3">
                    <h3 class="text-sm font-medium text-text-primary line-clamp-2 mb-2">${post.title}</h3>
                    <div class="flex items-center justify-between text-xs text-text-secondary">
                        <span>r/${post.subreddit}</span>
                        <div class="flex items-center space-x-2">
                            <span>👍 ${post.score}</span>
                            <span>💬 ${post.numComments}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getMediaType(post) {
        // Check if post and post.url exist
        if (!post || !post.url) return 'image';
        
        if (post.mediaType) return post.mediaType;
        if (post.url.includes('.gif')) return 'gif';
        if (post.url.includes('.mp4') || post.url.includes('.webm')) return 'video';
        if (post.url.includes('v.redd.it')) return 'video';
        if (post.url.includes('gfycat.com')) return 'gif';
        if (post.url.includes('redgifs.com')) return 'video';
        return 'image';
    }

    getMediaIcon(type) {
        const icons = {
            'image': '🖼️',
            'video': '🎥',
            'gif': '🎬'
        };
        return icons[type] || '📄';
    }

    openMediaModal(post, index = null) {
        if (!post) return;
        
        // Set current index
        if (index !== null) {
            this.currentModalIndex = index;
        }
        
        const modal = document.getElementById('mediaModal');
        const content = document.getElementById('modalContent');
        
        const mediaType = this.getMediaType(post);
        let mediaElement = '';
        
        // Add mobile detection
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (mediaType === 'video') {
            // Use proxy for better mobile compatibility
            const videoUrl = post.url ? `/api/proxy/video?url=${encodeURIComponent(post.url)}` : '';
            
            // Add mobile-specific fallback
            const fallbackContent = `
                <div class="text-center p-8">
                    <p class="text-red-400 mb-4">Video failed to load</p>
                    <div class="space-y-2">
                        <a href="${post.permalink || '#'}" target="_blank" class="block text-reddit-orange hover:underline">
                            View on Reddit
                        </a>
                        ${isMobile ? `<a href="${post.url || '#'}" target="_blank" class="block text-blue-400 hover:underline">
                            Open Video Directly
                        </a>` : ''}
                    </div>
                </div>
            `;
            
            mediaElement = `
                <video 
                    controls 
                    autoplay 
                    muted
                    playsinline
                    webkit-playsinline
                    preload="metadata"
                    class="max-w-full max-h-full rounded-lg"
                    src="${videoUrl}"
                    onerror="this.parentElement.innerHTML='${fallbackContent.replace(/'/g, "\\'")}'"
                >
                    Your browser does not support the video tag.
                    <a href="${post.permalink || '#'}" target="_blank" class="text-reddit-orange hover:underline">
                        View on Reddit
                    </a>
                </video>
            `;
        } else {
            mediaElement = `
                <img 
                    src="${post.url || '/placeholder.svg'}" 
                    alt="${post.title || 'Media content'}"
                    class="max-w-full max-h-full rounded-lg object-contain"
                    onerror="this.src='/placeholder.svg'"
                >
            `;
        }
        
        content.innerHTML = `
            <div class="text-center">
                ${mediaElement}
                <div class="mt-4 text-left max-w-2xl">
                    <h2 class="text-lg font-semibold text-white mb-2">${post.title || 'Untitled'}</h2>
                    <div class="flex items-center justify-between text-sm text-gray-300 mb-3">
                        <span>Posted by u/${post.author || 'unknown'} in r/${post.subreddit || 'unknown'}</span>
                        <span>${this.formatDate(post.created || Date.now() / 1000)}</span>
                    </div>
                    <div class="flex items-center space-x-4 text-sm text-gray-400">
                        <span>👍 ${post.score || 0}</span>
                        <span>💬 ${post.numComments || 0}</span>
                        <a href="${post.permalink || '#'}" target="_blank" class="text-reddit-orange hover:underline">
                            View on Reddit
                        </a>
                    </div>
                </div>
            </div>
        `;
        
        // Update navigation info
        this.updateModalNavigation();
        
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        const modal = document.getElementById('mediaModal');
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }

    navigateModal(direction) {
        if (this.posts.length === 0) return;
        
        if (direction === 'prev') {
            this.currentModalIndex = this.currentModalIndex > 0 ? this.currentModalIndex - 1 : this.posts.length - 1;
        } else if (direction === 'next') {
            this.currentModalIndex = this.currentModalIndex < this.posts.length - 1 ? this.currentModalIndex + 1 : 0;
        }
        
        const post = this.posts[this.currentModalIndex];
        this.openMediaModal(post, this.currentModalIndex);
    }

    scrollModal(direction) {
        const content = document.getElementById('modalContent');
        const scrollAmount = 100;
        
        if (direction === 'up') {
            content.scrollTop -= scrollAmount;
        } else if (direction === 'down') {
            content.scrollTop += scrollAmount;
        }
    }

    updateModalNavigation() {
        const currentIndexEl = document.getElementById('currentIndex');
        const totalCountEl = document.getElementById('totalCount');
        const prevButton = document.getElementById('prevButton');
        const nextButton = document.getElementById('nextButton');
        
        if (currentIndexEl && totalCountEl) {
            currentIndexEl.textContent = this.currentModalIndex + 1;
            totalCountEl.textContent = this.posts.length;
        }
        
        // Show/hide navigation buttons based on content
        if (prevButton && nextButton) {
            prevButton.style.display = this.posts.length > 1 ? 'block' : 'none';
            nextButton.style.display = this.posts.length > 1 ? 'block' : 'none';
        }
    }

    toggleSearch() {
        const container = document.getElementById('searchContainer');
        const input = document.getElementById('searchInput');
        
        console.log('Toggle search called, container hidden:', container.classList.contains('hidden'));
        
        if (container.classList.contains('hidden')) {
            container.classList.remove('hidden');
            input.focus();
            console.log('Search container shown');
        } else {
            container.classList.add('hidden');
            input.value = '';
            console.log('Search container hidden');
            // Clear search and go back to current subreddit
            if (this.currentSearch) {
                this.currentSearch = '';
                this.currentLimit = 25;
                this.posts = [];
                this.loadContent();
            }
        }
    }

    openSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('overlay');
        
        sidebar.classList.remove('-translate-x-full');
        overlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('overlay');
        
        sidebar.classList.add('-translate-x-full');
        overlay.classList.add('hidden');
        document.body.style.overflow = '';
    }

    showLoading() {
        document.getElementById('loadingState').classList.remove('hidden');
        document.getElementById('contentGrid').classList.add('hidden');
    }

    hideLoading() {
        document.getElementById('loadingState').classList.add('hidden');
        document.getElementById('contentGrid').classList.remove('hidden');
    }

    showError(message) {
        document.getElementById('errorMessage').textContent = message;
        document.getElementById('errorState').classList.remove('hidden');
        document.getElementById('contentGrid').classList.add('hidden');
    }

    hideError() {
        document.getElementById('errorState').classList.add('hidden');
    }

    showEmpty() {
        document.getElementById('emptyState').classList.remove('hidden');
        document.getElementById('contentGrid').classList.add('hidden');
    }

    hideEmpty() {
        document.getElementById('emptyState').classList.add('hidden');
    }

    formatDate(timestamp) {
        const date = new Date(timestamp * 1000);
        const now = new Date();
        const diff = now - date;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        
        return date.toLocaleDateString();
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        
        const colors = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            info: 'bg-blue-500'
        };
        
        toast.className = `${colors[type]} text-white px-4 py-2 rounded-lg shadow-lg transform translate-x-full transition-transform duration-300`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.classList.remove('translate-x-full');
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.add('translate-x-full');
            setTimeout(() => {
                container.removeChild(toast);
            }, 300);
        }, 3000);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.afroGIF = new AfroGIF();
    
    // Add test method to window for debugging
    window.testSearch = (query) => {
        console.log('Testing search with query:', query);
        window.afroGIF.currentSearch = query;
        window.afroGIF.currentSubreddit = '';
        window.afroGIF.currentLimit = 25;
        window.afroGIF.posts = [];
        window.afroGIF.updateCurrentSubredditDisplay();
        window.afroGIF.loadContent();
    };

    // Add method to test UI search
    window.testUISearch = () => {
        console.log('Testing UI search...');
        const searchContainer = document.getElementById('searchContainer');
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        
        console.log('Search container hidden:', searchContainer.classList.contains('hidden'));
        console.log('Search input value:', searchInput.value);
        console.log('Search button:', searchBtn);
        
        // Force show search container
        searchContainer.classList.remove('hidden');
        searchInput.value = 'test';
        searchInput.focus();
        
        console.log('Search container now visible:', !searchContainer.classList.contains('hidden'));
    };
});

// Add CSS for line-clamp utility
const style = document.createElement('style');
style.textContent = `
    .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
`;
document.head.appendChild(style); 