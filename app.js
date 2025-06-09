// App state
const state = {
    isAdmin: false,
    songs: [],
    playlists: {},
    currentPlaylist: null,
    slideshow: {
        active: false,
        currentIndex: 0,
        playlist: [],
        autoAdvance: false,
        intervalId: null,
        intervalSeconds: 5
    }
};

// DOM elements
const elements = {
    clock: document.getElementById('clock'),
    adminPassword: document.getElementById('adminPassword'),
    loginBtn: document.getElementById('loginBtn'),
    logoutBtn: document.getElementById('logoutBtn'),
    adminControls: document.getElementById('adminControls'),
    uploadArea: document.getElementById('uploadArea'),
    fileInput: document.getElementById('fileInput'),
    songsContainer: document.getElementById('songsContainer'),
    playlistSelect: document.getElementById('playlistSelect'),
    newPlaylistName: document.getElementById('newPlaylistName'),
    createPlaylistBtn: document.getElementById('createPlaylistBtn'),
    deletePlaylistBtn: document.getElementById('deletePlaylistBtn'),
    currentPlaylistName: document.getElementById('currentPlaylistName'),
    playlistItems: document.getElementById('playlistItems'),
    startSlideshowBtn: document.getElementById('startSlideshowBtn'),
    slideshowContainer: document.getElementById('slideshowContainer'),
    slideshowTitle: document.getElementById('slideshowTitle'),
    slideshowImage: document.getElementById('slideshowImage'),
    exitSlideshowBtn: document.getElementById('exitSlideshowBtn'),
    prevSlideBtn: document.getElementById('prevSlideBtn'),
    nextSlideBtn: document.getElementById('nextSlideBtn'),
    autoAdvanceCheckbox: document.getElementById('autoAdvanceCheckbox'),
    autoAdvanceInterval: document.getElementById('autoAdvanceInterval'),
    toast: document.getElementById('toast')
};

// Initialize the app
function init() {
    loadData();
    updateClock();
    setInterval(updateClock, 1000);
    setupEventListeners();
    renderSongs();
    renderPlaylists();
    checkAdminStatus();
}

// Load data from localStorage
function loadData() {
    const savedSongs = localStorage.getItem('mcgiSongs');
    const savedPlaylists = localStorage.getItem('mcgiPlaylists');
    
    if (savedSongs) {
        state.songs = JSON.parse(savedSongs);
    }
    
    if (savedPlaylists) {
        state.playlists = JSON.parse(savedPlaylists);
    }
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('mcgiSongs', JSON.stringify(state.songs));
    localStorage.setItem('mcgiPlaylists', JSON.stringify(state.playlists));
}

// Update the clock display
function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    elements.clock.textContent = timeString;
}

// Check admin status from localStorage
function checkAdminStatus() {
    const isAdmin = localStorage.getItem('mcgiAdmin') === 'true';
    if (isAdmin) {
        state.isAdmin = true;
        elements.adminControls.classList.add('active');
        elements.logoutBtn.style.display = 'block';
        elements.loginBtn.style.display = 'none';
    }
}

// Setup event listeners
function setupEventListeners() {
    // Admin auth
    elements.loginBtn.addEventListener('click', handleLogin);
    elements.logoutBtn.addEventListener('click', handleLogout);
    
    // File upload
    elements.uploadArea.addEventListener('click', () => elements.fileInput.click());
    elements.fileInput.addEventListener('change', handleFileUpload);
    elements.uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.uploadArea.style.borderColor = 'var(--primary-color)';
    });
    elements.uploadArea.addEventListener('dragleave', () => {
        elements.uploadArea.style.borderColor = 'var(--border-color)';
    });
    elements.uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        elements.uploadArea.style.borderColor = 'var(--border-color)';
        elements.fileInput.files = e.dataTransfer.files;
        handleFileUpload();
    });
    
    // Playlists
    elements.playlistSelect.addEventListener('change', handlePlaylistSelect);
    elements.createPlaylistBtn.addEventListener('click', handleCreatePlaylist);
    elements.deletePlaylistBtn.addEventListener('click', handleDeletePlaylist);
    elements.startSlideshowBtn.addEventListener('click', startSlideshow);
    
    // Slideshow
    elements.exitSlideshowBtn.addEventListener('click', exitSlideshow);
    elements.prevSlideBtn.addEventListener('click', showPreviousSlide);
    elements.nextSlideBtn.addEventListener('click', showNextSlide);
    elements.autoAdvanceCheckbox.addEventListener('change', toggleAutoAdvance);
    elements.autoAdvanceInterval.addEventListener('change', updateAutoAdvanceInterval);
    
    // Keyboard navigation
    document.addEventListener('keydown', handleKeyDown);
}

// Handle admin login
function handleLogin() {
    const password = elements.adminPassword.value;
    if (password === 'mcgiadmin1') {
        state.isAdmin = true;
        localStorage.setItem('mcgiAdmin', 'true');
        elements.adminControls.classList.add('active');
        elements.logoutBtn.style.display = 'block';
        elements.loginBtn.style.display = 'none';
        elements.adminPassword.value = '';
        showToast('Admin mode activated');
    } else {
        showToast('Incorrect password', true);
    }
}

// Handle admin logout
function handleLogout() {
    state.isAdmin = false;
    localStorage.removeItem('mcgiAdmin');
    elements.adminControls.classList.remove('active');
    elements.logoutBtn.style.display = 'none';
    elements.loginBtn.style.display = 'block';
    showToast('Admin mode deactivated');
}

// Handle file upload
function handleFileUpload() {
    if (!state.isAdmin) return;
    
    const files = elements.fileInput.files;
    if (!files || files.length === 0) return;
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type !== 'image/png') continue;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const fileName = file.name.replace('.png', '');
            const songId = Date.now().toString() + i;
            
            state.songs.push({
                id: songId,
                title: fileName,
                imageData: e.target.result
            });
            
            saveData();
            renderSongs();
            showToast(`Uploaded: ${fileName}`);
        };
        reader.readAsDataURL(file);
    }
    
    elements.fileInput.value = '';
}

// Render songs in the library
function renderSongs() {
    elements.songsContainer.innerHTML = '';
    
    state.songs.forEach(song => {
        const songCard = document.createElement('div');
        songCard.className = 'song-card';
        songCard.dataset.id = song.id;
        
        songCard.innerHTML = `
            <img src="${song.imageData}" alt="${song.title}" class="song-image">
            <div class="song-info">
                <h3 class="song-title" title="${song.title}">${song.title}</h3>
                <div class="song-actions">
                    ${state.currentPlaylist ? `<button class="btn-accent add-to-playlist">Add to Playlist</button>` : ''}
                    ${state.isAdmin ? `
                        <button class="btn-danger delete-song">Delete</button>
                        <button class="btn-primary rename-song">Rename</button>
                    ` : ''}
                </div>
            </div>
        `;
        
        elements.songsContainer.appendChild(songCard);
        
        // Add event listeners to buttons
        if (state.currentPlaylist) {
            songCard.querySelector('.add-to-playlist').addEventListener('click', () => {
                addSongToPlaylist(song.id);
            });
        }
        
        if (state.isAdmin) {
            songCard.querySelector('.delete-song').addEventListener('click', () => {
                deleteSong(song.id);
            });
            
            songCard.querySelector('.rename-song').addEventListener('click', () => {
                renameSong(song.id);
            });
        }
    });
    
    // Make songs sortable for admin
    if (state.isAdmin) {
        new Sortable(elements.songsContainer, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            onEnd: function() {
                const songCards = Array.from(elements.songsContainer.children);
                state.songs = songCards.map(card => {
                    return state.songs.find(song => song.id === card.dataset.id);
                });
                saveData();
            }
        });
    }
}

// Delete a song
function deleteSong(songId) {
    if (!state.isAdmin) return;
    
    if (confirm('Are you sure you want to delete this song?')) {
        // Remove from songs array
        state.songs = state.songs.filter(song => song.id !== songId);
        
        // Remove from all playlists
        for (const playlistName in state.playlists) {
            state.playlists[playlistName] = state.playlists[playlistName].filter(id => id !== songId);
        }
        
        saveData();
        renderSongs();
        renderPlaylistItems();
        showToast('Song deleted');
    }
}

// Rename a song
function renameSong(songId) {
    if (!state.isAdmin) return;
    
    const song = state.songs.find(s => s.id === songId);
    if (!song) return;
    
    const newTitle = prompt('Enter new title:', song.title);
    if (newTitle && newTitle.trim() !== '') {
        song.title = newTitle.trim();
        saveData();
        renderSongs();
        
        // Update in any playlists
        if (state.currentPlaylist) {
            renderPlaylistItems();
        }
        
        showToast('Song renamed');
    }
}

// Render playlist dropdown
function renderPlaylists() {
    elements.playlistSelect.innerHTML = '<option value="">Select a playlist</option>';
    
    for (const playlistName in state.playlists) {
        const option = document.createElement('option');
        option.value = playlistName;
        option.textContent = playlistName;
        elements.playlistSelect.appendChild(option);
    }
}

// Handle playlist selection
function handlePlaylistSelect() {
    const playlistName = elements.playlistSelect.value;
    state.currentPlaylist = playlistName || null;
    
    if (playlistName) {
        elements.currentPlaylistName.textContent = playlistName;
        elements.startSlideshowBtn.disabled = state.playlists[playlistName].length === 0;
    } else {
        elements.currentPlaylistName.textContent = 'None selected';
        elements.startSlideshowBtn.disabled = true;
    }
    
    renderPlaylistItems();
    renderSongs(); // Re-render to show/hide "Add to Playlist" buttons
}

// Render playlist items
function renderPlaylistItems() {
    elements.playlistItems.innerHTML = '';
    
    if (!state.currentPlaylist) return;
    
    const playlist = state.playlists[state.currentPlaylist] || [];
    
    playlist.forEach((songId, index) => {
        const song = state.songs.find(s => s.id === songId);
        if (!song) return;
        
        const item = document.createElement('li');
        item.className = 'playlist-item';
        item.dataset.index = index;
        
        item.innerHTML = `
            <div>
                <span class="drag-handle">☰</span>
                <span>${index + 1}. ${song.title}</span>
            </div>
            <div class="playlist-item-actions">
                <button class="btn-danger remove-from-playlist">Remove</button>
                <button class="btn-primary preview-slide">Preview</button>
            </div>
        `;
        
        elements.playlistItems.appendChild(item);
        
        item.querySelector('.remove-from-playlist').addEventListener('click', () => {
            removeFromPlaylist(index);
        });
        
        item.querySelector('.preview-slide').addEventListener('click', () => {
            previewSlide(songId);
        });
    });
    
    // Make playlist sortable
    new Sortable(elements.playlistItems, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        handle: '.drag-handle',
        onEnd: function() {
            const items = Array.from(elements.playlistItems.children);
            const newPlaylist = items.map(item => {
                return state.playlists[state.currentPlaylist][item.dataset.index];
            });
            
            state.playlists[state.currentPlaylist] = newPlaylist;
            saveData();
            
            // Update data-index attributes
            items.forEach((item, index) => {
                item.dataset.index = index;
            });
        }
    });
}

// Create a new playlist
function handleCreatePlaylist() {
    const playlistName = elements.newPlaylistName.value.trim();
    if (!playlistName) {
        showToast('Please enter a playlist name', true);
        return;
    }
    
    if (state.playlists[playlistName]) {
        showToast('Playlist already exists', true);
        return;
    }
    
    state.playlists[playlistName] = [];
    saveData();
    renderPlaylists();
    elements.newPlaylistName.value = '';
    showToast(`Playlist "${playlistName}" created`);
    
    // Select the new playlist
    elements.playlistSelect.value = playlistName;
    handlePlaylistSelect();
}

// Delete current playlist
function handleDeletePlaylist() {
    if (!state.currentPlaylist) {
        showToast('No playlist selected', true);
        return;
    }
    
    if (confirm(`Are you sure you want to delete the playlist "${state.currentPlaylist}"?`)) {
        delete state.playlists[state.currentPlaylist];
        saveData();
        state.currentPlaylist = null;
        renderPlaylists();
        handlePlaylistSelect();
        showToast('Playlist deleted');
    }
}

// Add song to current playlist
function addSongToPlaylist(songId) {
    if (!state.currentPlaylist) return;
    
    const playlist = state.playlists[state.currentPlaylist];
    if (playlist.includes(songId)) {
        showToast('Song already in playlist', true);
        return;
    }
    
    playlist.push(songId);
    saveData();
    renderPlaylistItems();
    elements.startSlideshowBtn.disabled = false;
    showToast('Song added to playlist');
}

// Remove song from playlist
function removeFromPlaylist(index) {
    if (!state.currentPlaylist) return;
    
    state.playlists[state.currentPlaylist].splice(index, 1);
    saveData();
    renderPlaylistItems();
    
    if (state.playlists[state.currentPlaylist].length === 0) {
        elements.startSlideshowBtn.disabled = true;
    }
    
    showToast('Song removed from playlist');
}

// Preview a slide
function previewSlide(songId) {
    const song = state.songs.find(s => s.id === songId);
    if (!song) return;
    
    elements.slideshowTitle.textContent = song.title;
    elements.slideshowImage.innerHTML = `<img src="${song.imageData}" alt="${song.title}">`;
    elements.slideshowContainer.style.display = 'flex';
    state.slideshow.active = true;
    
    // Disable auto-advance for preview
    if (state.slideshow.intervalId) {
        clearInterval(state.slideshow.intervalId);
        state.slideshow.intervalId = null;
    }
    elements.autoAdvanceCheckbox.checked = false;
}

// Start slideshow
function startSlideshow() {
    if (!state.currentPlaylist || state.playlists[state.currentPlaylist].length === 0) {
        showToast('No songs in playlist', true);
        return;
    }
    
    state.slideshow.playlist = state.playlists[state.currentPlaylist];
    state.slideshow.currentIndex = 0;
    state.slideshow.active = true;
    
    showCurrentSlide();
    elements.slideshowContainer.style.display = 'flex';
    
    // Set up auto-advance if checked
    if (elements.autoAdvanceCheckbox.checked) {
        toggleAutoAdvance();
    }
}

// Show current slide in slideshow
function showCurrentSlide() {
    const songId = state.slideshow.playlist[state.slideshow.currentIndex];
    const song = state.songs.find(s => s.id === songId);
    if (!song) return;
    
    elements.slideshowTitle.textContent = `${state.slideshow.currentIndex + 1}/${state.slideshow.playlist.length}: ${song.title}`;
    elements.slideshowImage.innerHTML = `<img src="${song.imageData}" alt="${song.title}">`;
}

// Show next slide
function showNextSlide() {
    if (!state.slideshow.active) return;
    
    if (state.slideshow.currentIndex < state.slideshow.playlist.length - 1) {
        state.slideshow.currentIndex++;
        showCurrentSlide();
    } else {
        if (state.slideshow.autoAdvance) {
            // Loop back to start if auto-advance is on
            state.slideshow.currentIndex = 0;
            showCurrentSlide();
        }
    }
}

// Show previous slide
function showPreviousSlide() {
    if (!state.slideshow.active) return;
    
    if (state.slideshow.currentIndex > 0) {
        state.slideshow.currentIndex--;
        showCurrentSlide();
    }
}

// Exit slideshow
function exitSlideshow() {
    state.slideshow.active = false;
    elements.slideshowContainer.style.display = 'none';
    
    if (state.slideshow.intervalId) {
        clearInterval(state.slideshow.intervalId);
        state.slideshow.intervalId = null;
    }
}

// Toggle auto-advance
function toggleAutoAdvance() {
    state.slideshow.autoAdvance = elements.autoAdvanceCheckbox.checked;
    
    if (state.slideshow.autoAdvance) {
        if (state.slideshow.intervalId) {
            clearInterval(state.slideshow.intervalId);
        }
        
        state.slideshow.intervalId = setInterval(() => {
            showNextSlide();
        }, state.slideshow.intervalSeconds * 1000);
    } else {
        if (state.slideshow.intervalId) {
            clearInterval(state.slideshow.intervalId);
            state.slideshow.intervalId = null;
        }
    }
}

// Update auto-advance interval
function updateAutoAdvanceInterval() {
    const seconds = parseInt(elements.autoAdvanceInterval.value);
    if (isNaN(seconds) || seconds < 1 || seconds > 60) {
        elements.autoAdvanceInterval.value = 5;
        state.slideshow.intervalSeconds = 5;
    } else {
        state.slideshow.intervalSeconds = seconds;
    }
    
    // Restart interval if it's active
    if (state.slideshow.autoAdvance && state.slideshow.intervalId) {
        clearInterval(state.slideshow.intervalId);
        state.slideshow.intervalId = setInterval(() => {
            showNextSlide();
        }, state.slideshow.intervalSeconds * 1000);
    }
}

// Handle keyboard navigation
function handleKeyDown(e) {
    if (!state.slideshow.active) return;
    
    switch (e.key) {
        case 'ArrowLeft':
        case 'PageUp':
            showPreviousSlide();
            break;
        case 'ArrowRight':
        case 'PageDown':
        case ' ':
            showNextSlide();
            break;
        case 'Escape':
            exitSlideshow();
            break;
    }
}

// Show toast notification
function showToast(message, isError = false) {
    elements.toast.textContent = message;
    elements.toast.style.backgroundColor = isError ? 'var(--danger-color)' : 'var(--accent-color)';
    elements.toast.style.display = 'block';
    
    setTimeout(() => {
        elements.toast.style.display = 'none';
    }, 3000);
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
