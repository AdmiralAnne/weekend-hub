import { initWeather, initClock } from './weather.js';
import { initTodo } from './todo.js';
import { initPlayer } from './player.js';

document.addEventListener('DOMContentLoaded', () => {
    // Start the modules (Theme is now removed)
    initClock();
    initWeather();
    initTodo();
    initPlayer();
});