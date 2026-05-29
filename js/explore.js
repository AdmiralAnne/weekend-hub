import { supabase } from './db.js';
import { initFooter } from './footer.js'; // <-- NEW: Import the footer

// Get the user's secret ID from their browser
function getGhostId() {
    return localStorage.getItem('study_ghost_id') || 'unknown_ghost';
}

document.addEventListener('DOMContentLoaded', async () => {
    
    initFooter(); // <-- NEW: Inject the footer into the Explore page!

    const grid = document.getElementById('tape-grid');
    const loadingMsg = document.getElementById('loading-msg');
    const myGhostId = getGhostId(); 

    // --- Dynamic Back Button Logic ---
    const backBtn = document.getElementById('back-to-deck-btn');
    const lastTape = localStorage.getItem('study_last_tape');
    if (lastTape && backBtn) {
        // If they came from a custom tape, rewrite the link to include the hash!
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

    // Edit Modal Variables
    const editModal = document.getElementById('edit-modal');
    const editTitleInput = document.getElementById('edit-tape-title');
    const editLinksInput = document.getElementById('edit-tape-links');
    let currentEditingTapeId = null;

    // Close Modal Button
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
        cardContent.innerHTML = `
            <h3>${tape.title}</h3>
            <p>${tape.tracks.length} Tracks</p>
            <div class="mini-spools">
                <div class="mini-spool"></div>
                <div class="mini-spool"></div>
            </div>
        `;
        
        cardContent.addEventListener('click', () => {
            window.location.href = `index.html#${tape.id}`;
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
                
                // Convert stored IDs back into full YouTube links for easy editing
                editTitleInput.value = tape.title;
                editLinksInput.value = tape.tracks.map(id => `https://youtu.be/${id}`).join('\n');
                
                editModal.style.display = 'flex'; // Show modal
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
            // Reload the page to reflect the new changes
            window.location.reload(); 
        }
    });
});