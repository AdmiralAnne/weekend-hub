export function initPlayer() {
    let ytPlayer = null;
    let isPlaying = false;
    
    // The Queue System
    let mixtape = {
        title: "Weekend Mix",
        tracks: [
            "EWrX250Zhko", // Main lofi
            "7hfTa8nXKk8", 
            "c6JAn-IGX6o"
        ] 
    };
    let currentTrackIndex = 0;

    // Check URL Hash for custom tape
    const hashData = window.location.hash.substring(1);
    if (hashData) {
        try {
            const decoded = JSON.parse(decodeURIComponent(atob(hashData)));
            mixtape = { title: decoded[0], tracks: decoded[1] };
        } catch (e) {
            console.error("Invalid tape URL.");
        }
    }

    document.getElementById('display-title').textContent = mixtape.title;
    renderTracklist();

    // 1. Load YouTube API
    if (!window.YT) {
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
    }

    window.onYouTubeIframeAPIReady = () => {
        ytPlayer = new YT.Player('yt-player', {
            height: '200', width: '200',
            videoId: mixtape.tracks[0],
            playerVars: { 'playsinline': 1, 'controls': 0, 'disablekb': 1 },
            events: { 
                'onStateChange': onPlayerStateChange,
                'onError': () => { console.error("Video Error/Blocked by Owner"); playNext(); }
            }
        });
    };

    function onPlayerStateChange(event) {
        const cassette = document.getElementById('cassette-body');
        const playBtn = document.getElementById('play-pause-btn');

        if (event.data == YT.PlayerState.PLAYING) {
            isPlaying = true;
            cassette.classList.add('playing');
            playBtn.textContent = '[ PAUSE ]';
            playBtn.classList.add('active-btn');
        } else {
            isPlaying = false;
            cassette.classList.remove('playing');
            playBtn.textContent = '[ PLAY ]';
            playBtn.classList.remove('active-btn');
        }

        // Auto-play next track in queue when current ends
        if (event.data == YT.PlayerState.ENDED) {
            playNext();
        }
    }

    // -- QUEUE CONTROL LOGIC --
    function playTrack(index) {
        if (!ytPlayer || !ytPlayer.loadVideoById) return;
        currentTrackIndex = index;
        ytPlayer.loadVideoById(mixtape.tracks[currentTrackIndex]);
        updateTracklistUI();
    }

    function playNext() {
        if (!ytPlayer) return;
        currentTrackIndex++;
        // Loop back to start if at the end of the queue
        if (currentTrackIndex >= mixtape.tracks.length) {
            currentTrackIndex = 0;
        }
        playTrack(currentTrackIndex);
    }

    function renderTracklist() {
        const tracklistEl = document.getElementById('tracklist');
        tracklistEl.innerHTML = ''; 
        
        mixtape.tracks.forEach((id, index) => {
            const div = document.createElement('div');
            div.className = 'track-item';
            div.id = `track-ui-${index}`;
            div.textContent = `> Track ${index + 1} Loading...`;
            
            // Allow clicking to jump to track
            div.addEventListener('click', () => { playTrack(index); });
            tracklistEl.appendChild(div);

            // Try to fetch real title safely
            fetch(`https://noembed.com/embed?dataType=json&url=https://www.youtube.com/watch?v=${id}`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.title) document.getElementById(`track-ui-${index}`).textContent = `> ${data.title}`;
                    else document.getElementById(`track-ui-${index}`).textContent = `> Track ${index + 1}`;
                }).catch(() => {
                    document.getElementById(`track-ui-${index}`).textContent = `> Track ${index + 1}`;
                });
        });
        updateTracklistUI();
    }

    function updateTracklistUI() {
        const items = document.querySelectorAll('.track-item');
        items.forEach((item, idx) => {
            if (idx === currentTrackIndex) item.classList.add('active');
            else item.classList.remove('active');
        });
    }

    // -- BUTTON LISTENERS --
    document.getElementById('play-pause-btn').addEventListener('click', () => {
        if (!ytPlayer || !ytPlayer.getPlayerState) return;
        if (isPlaying) ytPlayer.pauseVideo();
        else ytPlayer.playVideo();
    });

    document.getElementById('next-btn').addEventListener('click', () => {
        playNext();
    });

    // -- CREATOR MODAL LOGIC --
    const modal = document.getElementById('creator-modal');
    
    document.getElementById('open-creator-btn').addEventListener('click', () => {
        modal.classList.remove('hidden');
    });

    document.getElementById('cancel-creator-btn').addEventListener('click', () => {
        modal.classList.add('hidden');
        document.getElementById('share-container').classList.add('hidden');
    });

    document.getElementById('generate-tape-btn').addEventListener('click', () => {
        const title = document.getElementById('new-tape-title').value.trim() || "Weekend Mix";
        const rawLinks = document.getElementById('new-tape-links').value;

        // Parse IDs
        const newTrackIds = rawLinks.split('\n')
            .map(link => {
                const match = link.trim().match(/[?&]v=([^#&?]+)|youtu\.be\/([^#&?]+)/);
                return match ? (match[1] || match[2]) : null;
            })
            .filter(id => id !== null);

        if (newTrackIds.length === 0) {
            alert("No valid YouTube links found!");
            return;
        }

        // Generate encoded URL
        const payload = [title, newTrackIds];
        const hash = btoa(encodeURIComponent(JSON.stringify(payload)));
        const finalUrl = window.location.href.split('#')[0] + '#' + hash;

        // Show Share Link
        const shareContainer = document.getElementById('share-container');
        const shareInput = document.getElementById('share-link-input');
        shareContainer.classList.remove('hidden');
        shareInput.value = finalUrl;
        shareInput.select(); // auto-select for easy copying
    });
}