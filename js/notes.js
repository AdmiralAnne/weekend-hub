import { supabase } from './db.js';

export async function initNotes() {
    const notesArea = document.getElementById('notes-area');
    const titleArea = document.getElementById('note-title');
    const saveBtn = document.getElementById('save-note-btn');
    const statusMsg = document.getElementById('notes-status');
    
    const ghostId = localStorage.getItem('study_ghost_id');

    // 1. Load the active local draft
    notesArea.value = localStorage.getItem('study_draft_note') || '';
    titleArea.value = localStorage.getItem('study_draft_title') || '';

    // 2. Auto-save to browser memory on every keystroke
    notesArea.addEventListener('input', () => {
        localStorage.setItem('study_draft_note', notesArea.value);
        statusMsg.textContent = "Draft saved locally...";
    });
    titleArea.addEventListener('input', () => {
        localStorage.setItem('study_draft_title', titleArea.value);
    });

    // 3. Save as a PERMANENT Note to Supabase
    saveBtn.addEventListener('click', async () => {
        if (!ghostId) return alert("Ghost ID missing.");
        if (!notesArea.value.trim()) return alert("Note is empty!");
        
        saveBtn.textContent = "[ SAVING... ]";
        
        const { error } = await supabase
            .from('notes')
            .insert([{ 
                ghost_id: ghostId, 
                title: titleArea.value.trim() || 'Untitled Note',
                content: notesArea.value 
            }]);

        if (!error) {
            saveBtn.textContent = "[ LOGGED ]";
            statusMsg.textContent = "Note sent to Archive.";
            
            // Clear the scratchpad so you can start a new thought
            notesArea.value = '';
            titleArea.value = '';
            localStorage.removeItem('study_draft_note');
            localStorage.removeItem('study_draft_title');
            
            setTimeout(() => saveBtn.textContent = "[ SAVE NOTE ]", 2000);
        } else {
            console.error(error);
            saveBtn.textContent = "[ ERROR ]";
        }
    });
}