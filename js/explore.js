import { supabase } from './db.js';

document.addEventListener('DOMContentLoaded', async () => {
    const grid = document.getElementById('tape-grid');
    const loadingMsg = document.getElementById('loading-msg');

    // 1. Fetch all tapes from Supabase, newest first
    const { data, error } = await supabase
        .from('mixtapes')
        .select('*')
        .order('created_at', { ascending: false });

    // 2. Hide the loading message
    loadingMsg.style.display = 'none';

    // 3. Handle Errors or Empty Database
    if (error) {
        grid.innerHTML = `<h2 style="color: #ff5252;">Error loading archive.</h2>`;
        console.error(error);
        return;
    }

    if (data.length === 0) {
        grid.innerHTML = `<h2>No tapes found yet. Be the first to burn one!</h2>`;
        return;
    }

    // 4. Loop through the data and build a card for each tape
    data.forEach(tape => {
        const card = document.createElement('div');
        card.className = 'tape-card';
        
        // Build the HTML for the card
        card.innerHTML = `
            <h3>${tape.title}</h3>
            <p>${tape.tracks.length} Tracks</p>
            <div class="mini-spools">
                <div class="mini-spool"></div>
                <div class="mini-spool"></div>
            </div>
        `;

        // When clicked, send the user to the main dashboard with the tape's ID in the URL
        card.addEventListener('click', () => {
            window.location.href = `index.html#${tape.id}`;
        });

        grid.appendChild(card);
    });
});