import { supabase } from './db.js';

export async function initNotes() {
    const notesArea = document.getElementById('notes-area');
    const syncBtn = document.getElementById('sync-notes-btn');
    const statusMsg = document.getElementById('notes-status');
    
    // Retrieve the Ghost ID from your existing system
    const ghostId = localStorage.getItem('study_ghost_id');

    // 1. Instant Load from Local Storage
    const localNotes = localStorage.getItem('study_notes') || '';
    notesArea.value = localNotes;

    // 2. Background Sync: Check cloud for a newer version
    if (ghostId) {
        const { data, error } = await supabase
            .from('scratchpad')
            .select('content')
            .eq('ghost_id', ghostId)
            .single();
        
        if (data && !error && data.content !== localNotes) {
            notesArea.value = data.content;
            localStorage.setItem('study_notes', data.content);
            statusMsg.textContent = "Synced from cloud.";
        }
    }

    // 3. Auto-save to Local Storage on every keystroke
    notesArea.addEventListener('input', () => {
        localStorage.setItem('study_notes', notesArea.value);
        statusMsg.textContent = "Unsynced changes...";
        statusMsg.style.opacity = '1';
    });

    // 4. Manual Sync to Cloud
    syncBtn.addEventListener('click', async () => {
        if (!ghostId) {
            alert("Ghost ID missing. Cannot sync.");
            return;
        }
        
        syncBtn.textContent = "[ SYNCING... ]";
        
        // Upsert creates a new row if it doesn't exist, or updates if it does
        const { error } = await supabase
            .from('scratchpad')
            .upsert({ 
                ghost_id: ghostId, 
                content: notesArea.value, 
                updated_at: new Date() 
            });

        if (!error) {
            syncBtn.textContent = "[ SYNCED ]";
            statusMsg.textContent = "Backed up to cloud securely.";
            statusMsg.style.opacity = '0.5';
            setTimeout(() => syncBtn.textContent = "[ SYNC ]", 2000);
        } else {
            console.error(error);
            syncBtn.textContent = "[ ERROR ]";
        }
    });
}