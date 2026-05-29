export function initFooter() {
    const footer = document.createElement('footer');
    footer.className = 'site-footer';
    
    footer.innerHTML = `
        <div class="footer-content">
            Made with 💖 by<a href="https://marjidesigns.super.site" target="_blank" class="footer-link">[Marji]</a><br>
            <span class="footer-divider">/</span>
            <a href="https://github.com/AdmiralAnne/weekend-hub" target="_blank" class="footer-link">[GitHub]</a>
            <span class="footer-divider">/</span>
            <a href="terms.html" class="footer-link">[Terms & Privacy]</a>
        </div>
    `;
    
    // THE FIX: Append it to the container so it respects your vertical grid layout
    const container = document.querySelector('.dashboard-container');
    if (container) {
        container.appendChild(footer);
    } else {
        document.body.appendChild(footer); // Fallback
    }
}