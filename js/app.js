import { initWeather, initClock } from './weather.js';
import { initTodo } from './todo.js';
import { initPlayer } from './player.js';
import { initAmbient } from './ambient.js';
import { initFooter } from './footer.js'; // NEW

document.addEventListener('DOMContentLoaded', () => {
    initClock();
    initWeather();
    initTodo();
    initPlayer();
    initAmbient(); 
    initFooter(); // NEW: Injects the footer safely at the end
});