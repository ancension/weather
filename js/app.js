document.addEventListener('DOMContentLoaded', () => {
  
  const cityInput        = document.getElementById('city-input');
  const searchBtn        = document.getElementById('search-btn');
  const form             = document.getElementById('search-form');
  const recentSearchesEl = document.getElementById('recent-searches');
  const spinnerEl        = document.getElementById('spinner');
  const currentWeatherEl = document.getElementById('current-weather');
  const forecastCardsEl  = document.getElementById('forecast-cards');


  let recentCities = JSON.parse(localStorage.getItem('recentCities')) || [];
  renderRecent();

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const city = cityInput.value.trim();
    if (!city) return;

    showLoading();
    searchBtn.disabled = true;

    try {
      const [curRes, fRes] = await Promise.all([
        fetchWithTimeout(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`),
        fetchWithTimeout(`https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`)
      ]);

      if (!curRes.ok || !fRes.ok) throw new Error('City not found');

      const currentData  = await curRes.json();
      const forecastData = await fRes.json();

      displayCurrent(currentData);
      displayForecast(forecastData);
      saveRecent(city);

    } catch (err) {
      alert(err.message);
    } finally {
      hideLoading();
      searchBtn.disabled = false;
      cityInput.value = '';
    }
  });

  function fetchWithTimeout(url, timeout = 8000) {
    return Promise.race([
      fetch(url),
      new Promise((_, rej) => setTimeout(() => rej(new Error('Request timed out')), timeout))
    ]);
  }

  function showLoading() {
    spinnerEl.style.display = 'flex';
  }
  function hideLoading() {
    spinnerEl.style.display = 'none';
  }

  function displayCurrent(data) {
    document.getElementById('current-city').textContent     = data.name;
    document.getElementById('current-date').textContent     = new Date().toLocaleDateString();
    document.getElementById('current-temp').textContent     = `${Math.round(data.main.temp)}°C`;
    document.getElementById('current-desc').textContent     = data.weather[0].description;
    document.getElementById('current-humidity').textContent = `${data.main.humidity}%`;
    document.getElementById('current-wind').textContent     = `${data.wind.speed} m/s`;
    document.getElementById('current-pressure').textContent = `${data.main.pressure} hPa`;

    const iconEl = document.getElementById('current-icon');
    iconEl.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    iconEl.alt = data.weather[0].description;

    currentWeatherEl.style.display = 'block';
  }

  function displayForecast(data) {
    const daily = data.list.filter(item => item.dt_txt.includes('12:00:00'));
    forecastCardsEl.innerHTML = daily.map(d => {
      const dt   = new Date(d.dt_txt);
      const day  = dt.toLocaleDateString(undefined, { weekday: 'short' });
      const date = dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      return `
        <div class="col-6 col-md-4 col-lg-2">
          <div class="glass-card text-center py-3 h-100">
            <img src="https://openweathermap.org/img/wn/${d.weather[0].icon}@2x.png"
                 alt="${d.weather[0].description}" width="48" height="48">
            <div class="fw-bold mt-2">${day}</div>
            <div class="text-secondary small">${date}</div>
            <div class="fw-bold fs-4 mt-1">${Math.round(d.main.temp)}°C</div>
            <div class="small">💧 ${d.main.humidity}%  💨 ${d.wind.speed} m/s</div>
          </div>
        </div>
      `;
    }).join('');
    document.getElementById('forecast').style.display = 'block';
  }

  function saveRecent(city) {
    recentCities = [city, ...recentCities.filter(c => c !== city)].slice(0, 5);
    localStorage.setItem('recentCities', JSON.stringify(recentCities));
    renderRecent();
  }

  function renderRecent() {
    recentSearchesEl.innerHTML = '';
    recentCities.forEach(city => {
      const chip = document.createElement('div');
      chip.className = 'chip';
      chip.textContent = city;
      chip.addEventListener('click', () => {
        cityInput.value = city;
        form.dispatchEvent(new Event('submit'));
      });
      recentSearchesEl.appendChild(chip);
    });
  }
});
