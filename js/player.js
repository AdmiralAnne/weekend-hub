import { supabase } from './db.js';

export async function initPlayer() {
    let ytPlayer = null;
    let isPlaying = false;
    let currentTrackIndex = 0;
    
    // Default Mixtape
    let mixtape = {
        title: "Weekend Mix",
        tracks: ["EWrX250Zhko", "TfmECBzmOn4", "7hfTa8nXKk8", "c6JAn-IGX6o"] 
    };

    // 1. CHECK FOR CLOUD TAPE ON LOAD
    const hashData = window.location.hash.substring(1);
    if (hashData && hashData.length > 20) { // UUIDs are 36 characters
        document.getElementById('display-title').textContent = "Loading cloud tape...";
        
        // Fetch from Supabase!
        const { data, error } = await supabase
            .from('mixtapes')
            .select('*')
            .eq('id', hashData)
            .single();

        if (data && !error) {
            mixtape = { title: data.title, tracks: data.tracks };
        } else {
            console.error("Tape not found in database.");
        }
    }

    // Set UI Title and render the tracks
    document.getElementById('display-title').textContent = mixtape.title;
    renderTracklist();

    // 2. LOAD YOUTUBE API (Only after database finishes loading!)
    if (!window.YT) {
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
    } else if (window.YT && window.YT.Player) {
        setupYTPlayer(); // If API is already loaded from a page refresh
    }

    window.onYouTubeIframeAPIReady = () => {
        setupYTPlayer();
    };

    function setupYTPlayer() {
        ytPlayer = new YT.Player('yt-player', {
            height: '200', width: '200',
            videoId: mixtape.tracks[0],
            playerVars: { 'playsinline': 1, 'controls': 0, 'disablekb': 1 },
            events: { 
                'onStateChange': onPlayerStateChange,
                'onError': () => { console.error("Video Error/Blocked"); playNext(); }
            }
        });
    }

    // 3. STANDARD PLAYER LOGIC
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

        if (event.data == YT.PlayerState.ENDED) playNext();
    }

    function playTrack(index) {
        if (!ytPlayer || !ytPlayer.loadVideoById) return;
        currentTrackIndex = index;
        ytPlayer.loadVideoById(mixtape.tracks[currentTrackIndex]);
        updateTracklistUI();
    }

    function playNext() {
        if (!ytPlayer) return;
        currentTrackIndex++;
        if (currentTrackIndex >= mixtape.tracks.length) currentTrackIndex = 0;
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
            div.addEventListener('click', () => { playTrack(index); });
            tracklistEl.appendChild(div);

            fetch(`https://noembed.com/embed?dataType=json&url=https://www.youtube.com/watch?v=${id}`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.title) document.getElementById(`track-ui-${index}`).textContent = `> ${data.title}`;
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

    document.getElementById('play-pause-btn').addEventListener('click', () => {
        if (!ytPlayer || !ytPlayer.getPlayerState) return;
        if (isPlaying) ytPlayer.pauseVideo();
        else ytPlayer.playVideo();
    });

    document.getElementById('next-btn').addEventListener('click', () => playNext());

    // 4. CREATOR MODAL & SAVE TO DATABASE LOGIC
    const modal = document.getElementById('creator-modal');
    
    document.getElementById('open-creator-btn').addEventListener('click', () => {
        modal.classList.remove('hidden');
    });

    document.getElementById('cancel-creator-btn').addEventListener('click', () => {
        modal.classList.add('hidden');
        document.getElementById('share-container').classList.add('hidden');
    });

    document.getElementById('generate-tape-btn').addEventListener('click', async () => {
        const title = document.getElementById('new-tape-title').value.trim() || "Weekend Mix";
        const rawLinks = document.getElementById('new-tape-links').value;

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

        const shareInput = document.getElementById('share-link-input');
        shareInput.value = "Saving to cloud...";
        document.getElementById('share-container').classList.remove('hidden');

        // SAVE TO SUPABASE!
        const { data, error } = await supabase
            .from('mixtapes')
            .insert([{ title: title, tracks: newTrackIds }])
            .select();

        if (error) {
            alert("Error saving tape!");
            console.error(error);
            return;
        }

        // Generate the clean database URL
        const finalUrl = window.location.href.split('#')[0] + '#' + data[0].id;
        shareInput.value = finalUrl;
        shareInput.select();
    });
}