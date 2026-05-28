export function initAmbient() {
    // 1. Point directly to your local, high-quality MP3 files!
    const sounds = {
        rain: new Audio('sounds/rain.mp3'),
        cafe: new Audio('sounds/cafe.mp3'),
        fire: new Audio('sounds/fire.mp3'),
        night: new Audio('sounds/night.mp3')
    };

    // 2. Configure them to loop and start at 0 volume
    for (let key in sounds) {
        sounds[key].loop = true;
        sounds[key].volume = 0;
    }

    // 3. Connect sliders to the audio objects
    const bindSlider = (sliderId, soundKey) => {
        const slider = document.getElementById(sliderId);
        
        slider.addEventListener('input', (e) => {
            const vol = parseFloat(e.target.value);
            sounds[soundKey].volume = vol;

            if (vol > 0 && sounds[soundKey].paused) {
                sounds[soundKey].play().catch(err => console.warn("Browser blocked autoplay", err));
            } else if (vol === 0 && !sounds[soundKey].paused) {
                sounds[soundKey].pause();
            }
        });
    };

    // 4. Activate all sliders
    bindSlider('vol-rain', 'rain');
    bindSlider('vol-cafe', 'cafe');
    bindSlider('vol-fire', 'fire');
    bindSlider('vol-night', 'night');
}