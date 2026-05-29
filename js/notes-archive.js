import { supabase } from './db.js';
import { initFooter } from './footer.js';

document.addEventListener('DOMContentLoaded', async () => {
    
    initFooter(); // Inject the universal footer

    const grid = document.getElementById('notes-grid');
    const loadingMsg = document.getElementById('loading-msg');
    
    const ghostId = localStorage.getItem('study_ghost_id');

    if (!ghostId) {
        loadingMsg.innerHTML = `<span style="color: #ff5252;">Error: No Ghost ID found.</span>`;
        return;
    }

    // 1. Fetch only THIS user's notes, newest first
    const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('ghost_id', ghostId)
        .order('created_at', { ascending: false });

    loadingMsg.style.display = 'none';

    if (error) {
        grid.innerHTML = `<h2 style="color: #ff5252;">Error loading logs.</h2>`;
        console.error(error);
        return;
    }

    if (data.length === 0) {
        grid.innerHTML = `<h2>No logs found. Start writing in your Scratchpad!</h2>`;
        return;
    }

    // Modal Variables
    const readModal = document.getElementById('read-note-modal');
    const modalTitle = document.getElementById('modal-note-title');
    const modalDate = document.getElementById('modal-note-date');
    const modalContent = document.getElementById('modal-note-content');
    let currentViewingNoteId = null;

    // Close Modal Button
    document.getElementById('close-note-btn').addEventListener('click', () => {
        readModal.style.display = 'none';
        readModal.classList.add('hidden');
    });

    // 2. Build the Grid
    data.forEach(note => {
        const card = document.createElement('div');
        card.className = 'tape-card'; // Reusing your awesome card styling
        
        // Format the date nicely
        const dateObj = new Date(note.created_at);
        const dateStr = dateObj.toLocaleDateString() + ' // ' + dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

        card.innerHTML = `
            <div class="tape-info">
                <h3>${note.title}</h3>
                <p style="font-size: 1.2rem; margin-top: 5px;">${dateStr}</p>
                <div style="margin-top: 15px; font-size: 1.4rem; opacity: 0.7; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;">
                    ${note.content}
                </div>
            </div>
        `;
        
        // Open the modal when clicked
        card.addEventListener('click', () => {
            currentViewingNoteId = note.id;
            modalTitle.textContent = `// ${note.title.toUpperCase()}`;
            modalDate.textContent = `Logged on: ${dateStr}`;
            modalContent.textContent = note.content;
            
            readModal.style.display = 'flex';
            readModal.classList.remove('hidden');
        });

        grid.appendChild(card);
    });

    // 3. Delete Logic
    document.getElementById('delete-note-btn').addEventListener('click', async () => {
        if (!currentViewingNoteId) return;
        
        if(confirm('Purge this log permanently?')) {
            document.getElementById('delete-note-btn').textContent = "PURGING...";
            
            const { error } = await supabase
                .from('notes')
                .delete()
                .eq('id', currentViewingNoteId);
                
            if (!error) {
                window.location.reload(); // Refresh to show it's gone
            } else {
                alert("Error deleting note.");
                document.getElementById('delete-note-btn').textContent = "DELETE LOG";
            }
        }
    });
});