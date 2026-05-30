import { supabase } from './db.js';

export async function initPlayer() {
    let ytPlayer = null;
    let isPlaying = false;
    let currentTrackIndex = 0;
    
    // --- NEW: THE OFFICIAL GENESIS TAPE ---
    // PASTE your new tape's ID right here between the quotes:
    const DEFAULT_TAPE_ID = "70a1df74-d198-4c1f-aac2-14c9dcf43ce6";

    let mixtape = { title: "Loading...", tracks: [] };

    // 1. CHECK FOR CLOUD TAPE ON LOAD
    let hashData = window.location.hash.substring(1);
    
    // If there is no hash in the URL, force it to load the Default Tape!
    if (!hashData || hashData.length < 20) {
        hashData = DEFAULT_TAPE_ID;
        // Update the browser URL silently so the back buttons still work
        window.history.replaceState(null, null, `#${hashData}`); 
    }

    document.getElementById('display-title').textContent = "Fetching cloud tape...";
        
    const { data, error } = await supabase
        .from('mixtapes')
        .select('*')
        .eq('id', hashData)
        .single();

    if (data && !error) {
        mixtape = { title: data.title, tracks: data.tracks };
        localStorage.setItem('study_last_tape', hashData); 
        
        // --- NEW: ANALYTICS TRACKING ---
        // Silently increment the play count in the background every time the tape loads
        const newPlays = (data.plays || 0) + 1;
        supabase.from('mixtapes').update({ plays: newPlays }).eq('id', hashData).then();
        
    } else {
        // Fallback just in case they have no internet connection
        mixtape = { 
            title: "Offline Mix", 
            tracks: ["9BNOOIe8i84", "Ksut6ib0VSY", "8scL5oJX6CM", "7NOSDKb0HlU"] 
        };
    }

    // Set UI Title and render the tracks
    document.getElementById('display-title').textContent = mixtape.title;
    renderTracklist();

    // LOAD YOUTUBE API (Only after database finishes loading- otherwise there's a bug)
    if (!window.YT) {
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
    } else if (window.YT && window.YT.Player) {
        setupYTPlayer(); 
    }

    window.onYouTubeIframeAPIReady = () => {
        setupYTPlayer();
    };

    function setupYTPlayer() {
        ytPlayer = new YT.Player('yt-player', {
            height: '200', width: '200',
            videoId: mixtape.tracks[0],
            playerVars: { 
                'playsinline': 1, 
                'controls': 0, 
                'disablekb': 1,
                'origin': window.location.origin // a diy fix for the target origin erro
            },
            events: { 
                'onStateChange': onPlayerStateChange,
                'onError': () => { 
                    console.error("Video Error/Blocked. Skipping to next..."); 
                    setTimeout(playNext, 500); // Safely skip without infinite loop crashes
                }
            }
        });
    }

    // music player logic idk if I can add all the details in the commeents
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

        // Upgraded link parser that catches standard, mobile, shorts, and live links
        const newTrackIds = rawLinks.split('\n')
            .map(link => {
                const match = link.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|live\/|shorts\/))([^#&?]*).*/);
                return (match && match[1].length === 11) ? match[1] : null;
            })
            .filter(id => id !== null);

        if (newTrackIds.length === 0) {
            alert("No valid YouTube links found!");
            return;
        }

        const shareInput = document.getElementById('share-link-input');
        shareInput.value = "Saving to cloud...";
        document.getElementById('share-container').classList.remove('hidden');

        // --- NEW: Ghost User Authentication ---
        let ghostId = localStorage.getItem('study_ghost_id');
        if (!ghostId) {
            ghostId = 'user_' + Math.random().toString(36).substr(2, 12);
            localStorage.setItem('study_ghost_id', ghostId);
        }

        // SAVE TO SUPABASE WITH CREATOR ID!
        const { data, error } = await supabase
            .from('mixtapes')
            .insert([{ 
                title: title, 
                tracks: newTrackIds,
                creator_id: ghostId // <-- This stamps the tape as yours
            }])
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