import { supabase } from './db.js';
import { initFooter } from './footer.js'; 

// Get the user's secret ID from their browser
function getGhostId() {
    return localStorage.getItem('study_ghost_id') || 'unknown_ghost';
}

document.addEventListener('DOMContentLoaded', async () => {
    
    initFooter(); 

    const grid = document.getElementById('tape-grid');
    const loadingMsg = document.getElementById('loading-msg');
    const myGhostId = getGhostId(); 

    // --- Dynamic Back Button Logic ---
    const backBtn = document.getElementById('back-to-deck-btn');
    const lastTape = localStorage.getItem('study_last_tape');
    if (lastTape && backBtn) {
        backBtn.href = `index.html#${lastTape}`;
    }

    // Fetch all tapes from Supabase, newest first
    const { data, error } = await supabase
        .from('mixtapes')
        .select('*')
        .order('created_at', { ascending: false });

    loadingMsg.style.display = 'none';

    if (error) {
        grid.innerHTML = `<h2 style="color: #ff5252;">Error loading archive.</h2>`;
        return;
    }

    if (data.length === 0) {
        grid.innerHTML = `<h2>No tapes found yet. Be the first to burn one!</h2>`;
        return;
    }

    // --- CALCULATE & INJECT GLOBAL ANALYTICS ---
    let totalTapes = data.length;
    let totalTracks = 0;
    let totalLikes = 0;
    let totalPlays = 0;

    data.forEach(tape => {
        totalTracks += tape.tracks.length;
        totalLikes += (tape.likes || 0);
        totalPlays += (tape.plays || 0);
    });

    document.getElementById('stat-tapes').textContent = totalTapes;
    document.getElementById('stat-tracks').textContent = totalTracks;
    document.getElementById('stat-likes').textContent = totalLikes;
    document.getElementById('stat-plays').textContent = totalPlays;

    // Edit Modal Variables
    const editModal = document.getElementById('edit-modal');
    const editTitleInput = document.getElementById('edit-tape-title');
    const editLinksInput = document.getElementById('edit-tape-links');
    let currentEditingTapeId = null;

    document.getElementById('cancel-edit-btn').addEventListener('click', () => {
        editModal.style.display = 'none';
        editModal.classList.add('hidden');
    });

    data.forEach(tape => {
        const card = document.createElement('div');
        card.className = 'tape-card';
        
        // 1. Build the playable part of the card
        const cardContent = document.createElement('div');
        cardContent.className = 'tape-info';
        
        // Load the user's previously liked tapes from local memory
        let likedTapes = JSON.parse(localStorage.getItem('study_liked_tapes') || '[]');
        const isLiked = likedTapes.includes(tape.id);
        const currentLikes = tape.likes || 0;

        cardContent.innerHTML = `
            <h3>${tape.title}</h3>
            <p>${tape.tracks.length} Tracks</p>
            <div class="mini-spools">
                <div class="mini-spool"></div>
                <div class="mini-spool"></div>
            </div>
            
            <div class="like-container">
                <button class="like-btn" title="Like this tape">
                    <img src="img/heart.png" class="like-icon ${isLiked ? 'liked' : ''}" alt="Heart">
                </button>
                <span class="like-count">${currentLikes}</span>
            </div>
        `;
        
        // Handle clicking the card to play it (skips if they clicked the heart)
        cardContent.addEventListener('click', (e) => {
            if (e.target.closest('.like-btn')) return; 
            window.location.href = `index.html#${tape.id}`;
        });

        // --- NEW: TOGGLE LIKE BUTTON LOGIC ---
        const likeBtn = cardContent.querySelector('.like-btn');
        const likeIcon = cardContent.querySelector('.like-icon');
        const likeCountEl = cardContent.querySelector('.like-count');

        likeBtn.addEventListener('click', async (e) => {
            e.stopPropagation(); 

            let currentLikedTapes = JSON.parse(localStorage.getItem('study_liked_tapes') || '[]');
            const isCurrentlyLiked = currentLikedTapes.includes(tape.id);
            
            // Get the live number directly from the UI
            let currentDisplayLikes = parseInt(likeCountEl.textContent);
            const globalLikesEl = document.getElementById('stat-likes');

            let newLikeTotal;

            if (isCurrentlyLiked) {
                // 1. UNLIKE LOGIC
                likeIcon.classList.remove('liked');
                newLikeTotal = Math.max(0, currentDisplayLikes - 1); // Prevents negative numbers
                likeCountEl.textContent = newLikeTotal;
                
                if (globalLikesEl) {
                    globalLikesEl.textContent = Math.max(0, parseInt(globalLikesEl.textContent) - 1);
                }

                // Remove the ID from local storage
                currentLikedTapes = currentLikedTapes.filter(id => id !== tape.id);

            } else {
                // 2. LIKE LOGIC
                likeIcon.classList.add('liked');
                newLikeTotal = currentDisplayLikes + 1;
                likeCountEl.textContent = newLikeTotal;
                
                if (globalLikesEl) {
                    globalLikesEl.textContent = parseInt(globalLikesEl.textContent) + 1;
                }

                // Add the ID to local storage
                currentLikedTapes.push(tape.id);
            }

            // Save the updated list back to the browser
            localStorage.setItem('study_liked_tapes', JSON.stringify(currentLikedTapes));

            // 3. Update Supabase silently in the background
            const { error } = await supabase
                .from('mixtapes')
                .update({ likes: newLikeTotal })
                .eq('id', tape.id);

            if (error) console.error("Failed to update likes:", error);
        });

        card.appendChild(cardContent);

        // 2. Add CRUD Controls ONLY if you own the tape (Ghost ID check)
        if (tape.creator_id === myGhostId) {
            const controls = document.createElement('div');
            controls.style.display = 'flex';
            controls.style.justifyContent = 'space-around';
            controls.style.marginTop = '15px';
            controls.style.borderTop = '1px dashed var(--border)';
            controls.style.paddingTop = '10px';
            
            controls.innerHTML = `
                <button class="edit-btn text-btn" style="font-size: 1.2rem; cursor: pointer;">[ EDIT ]</button>
                <button class="delete-btn text-btn" style="font-size: 1.2rem; color: #ff5252; cursor: pointer;">[ DELETE ]</button>
            `;
            
            // UPDATE LOGIC (Open Modal and populate data)
            controls.querySelector('.edit-btn').addEventListener('click', (e) => {
                e.stopPropagation(); 
                currentEditingTapeId = tape.id;
                
                editTitleInput.value = tape.title;
                editLinksInput.value = tape.tracks.map(id => `https://youtu.be/${id}`).join('\n');
                
                editModal.style.display = 'flex';
                editModal.classList.remove('hidden');
            });

            // DELETE LOGIC
            controls.querySelector('.delete-btn').addEventListener('click', async (e) => {
                e.stopPropagation(); 
                if(confirm('Burn this tape permanently? This cannot be undone.')) {
                    card.style.opacity = '0.3';
                    await supabase.from('mixtapes').delete().eq('id', tape.id);
                    card.remove(); 
                }
            });

            card.appendChild(controls);
        }

        grid.appendChild(card);
    });

    // 3. HANDLE SAVING THE EDITED TAPE
    document.getElementById('save-edit-btn').addEventListener('click', async () => {
        const newTitle = editTitleInput.value.trim() || "Updated Mix";
        const rawLinks = editLinksInput.value;

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

        document.getElementById('save-edit-btn').textContent = "[ SAVING... ]";

        // Push updates to Supabase
        const { error } = await supabase
            .from('mixtapes')
            .update({ title: newTitle, tracks: newTrackIds })
            .eq('id', currentEditingTapeId);

        if (error) {
            alert("Error updating tape.");
            console.error(error);
            document.getElementById('save-edit-btn').textContent = "[ SAVE CHANGES ]";
        } else {
            window.location.reload(); 
        }
    });
});