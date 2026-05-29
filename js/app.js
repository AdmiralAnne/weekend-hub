import { initWeather, initClock } from './weather.js';
import { initTodo } from './todo.js';
import { initPlayer } from './player.js';
import { initAmbient } from './ambient.js';
import { initFooter } from './footer.js';
import { initNotes } from './notes.js';


document.addEventListener('DOMContentLoaded', () => {
    initClock();
    initWeather();
    initTodo();
    initPlayer();
    initAmbient(); 
    initFooter();
    initNotes();
});