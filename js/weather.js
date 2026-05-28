export function initClock() {
    const clockEl = document.getElementById('clock');
    
    function updateTime() {
        const now = new Date();
        clockEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    updateTime(); 
    setInterval(updateTime, 1000); 
}

export async function initWeather() {
    const API_KEY = 'f760facf1f93d350a043484540c1bf0b'; 
    const weatherEl = document.getElementById('weather');
    const citySelect = document.getElementById('city-select');

    // 1. Check local storage to see if you previously saved a city, default to Hyderabad
    const savedCity = localStorage.getItem('study_city') || 'Hyderabad';
    citySelect.value = savedCity;

    // 2. Function to actually fetch the data
    async function fetchWeather(city) {
        weatherEl.textContent = "..."; // Loading state
        try {
            const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`);
            const data = await res.json();
            
            // Catch typos or missing cities
            if (data.cod !== 200) {
                weatherEl.textContent = "Location Error";
                return;
            }

            const temp = Math.round(data.main.temp);
            const desc = data.weather[0].main;
            
            // We don't need to show the city name here because it's in the dropdown!
            weatherEl.textContent = `${temp}°C // ${desc}`;
        } catch (error) {
            weatherEl.textContent = "Offline";
            console.error(error);
        }
    }

    // 3. Fetch weather for the initial load
    fetchWeather(savedCity);

    // 4. Listen for when you change the dropdown
    citySelect.addEventListener('change', (event) => {
        const newCity = event.target.value;
        localStorage.setItem('study_city', newCity); // Save it for next time
        fetchWeather(newCity); // Fetch the new temp
    });
}