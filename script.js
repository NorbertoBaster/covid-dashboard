// -----------------------------
// DOM ELEMENTS
// -----------------------------
const statsCards = document.getElementById('stats-cards');
const skeletonCards = document.getElementById('skeleton-cards');
const errorEl = document.getElementById('error');
const countrySelect = document.getElementById('country-select');
const themeToggle = document.getElementById('theme-toggle');
const lastUpdatedEl = document.getElementById('last-updated');

// -----------------------------
// DARK / LIGHT MODE
// -----------------------------
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
  });
}

// -----------------------------
// CHART INSTANCE
// -----------------------------
let chartInstance = null;

// -----------------------------
// FETCH DATA
// -----------------------------
async function fetchData(country = 'all') {
  try {
    // UI STATES
    skeletonCards.style.display = 'grid';
    statsCards.innerHTML = '';
    errorEl.classList.add('hidden');

    // API URLs
    const statsURL =
      country === 'all'
        ? 'https://disease.sh/v3/covid-19/all'
        : `https://disease.sh/v3/covid-19/countries/${country}`;

    const historyURL =
      country === 'all'
        ? 'https://disease.sh/v3/covid-19/historical/all?lastdays=8'
        : `https://disease.sh/v3/covid-19/historical/${country}?lastdays=8`;

    const [statsRes, historyRes] = await Promise.all([
      fetch(statsURL),
      fetch(historyURL)
    ]);

    if (!statsRes.ok || !historyRes.ok) {
      throw new Error('Failed to fetch data');
    }

    const statsData = await statsRes.json();
    const historyData = await historyRes.json();

    // -----------------------------
    // STATS CARDS (WITH ICONS)
    // -----------------------------
    statsCards.innerHTML = `
      <div class="card">
        <i class="fa-solid fa-virus icon cases"></i>
        <div class="card-content">
          <h3>Total Cases</h3>
          <p class="counter" data-value="${Number(statsData.cases)}">0</p>
        </div>
      </div>

      <div class="card">
        <i class="fa-solid fa-skull-crossbones icon deaths"></i>
        <div class="card-content">
          <h3>Deaths</h3>
          <p class="counter" data-value="${Number(statsData.deaths)}">0</p>
        </div>
      </div>

      <div class="card">
        <i class="fa-solid fa-heart icon recovered"></i>
        <div class="card-content">
          <h3>Recovered</h3>
          <p class="counter" data-value="${Number(statsData.recovered || 0)}">0</p>
        </div>
      </div>
    `;

    animateCounters();

    // -----------------------------
    // CHART DATA
    // -----------------------------
    const casesTimeline =
      country === 'all'
        ? historyData.cases
        : historyData.timeline.cases;

    const dates = Object.keys(casesTimeline);
    const dailyCases = [];

    for (let i = 1; i < dates.length; i++) {
      dailyCases.push(casesTimeline[dates[i]] - casesTimeline[dates[i - 1]]);
    }

    createChart(dates.slice(1), dailyCases);

    // -----------------------------
    // LAST UPDATED
    // -----------------------------
    lastUpdatedEl.textContent = `Last updated: ${new Date().toLocaleString()}`;

    // UI STATE
    skeletonCards.style.display = 'none';

  } catch (error) {
    console.error(error);
    skeletonCards.style.display = 'none';
    errorEl.classList.remove('hidden');
  }
}

// -----------------------------
// CHART.JS
// -----------------------------
function createChart(labels, data) {
  const ctx = document.getElementById('mainChart').getContext('2d');

  if (chartInstance) chartInstance.destroy();

  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, 'rgba(75, 192, 192, 0.4)');
  gradient.addColorStop(1, 'rgba(75, 192, 192, 0)');

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Daily New Cases',
        data,
        borderColor: '#4bc0c0',
        backgroundColor: gradient,
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true },
        tooltip: { mode: 'index', intersect: false }
      },
      scales: {
        x: { title: { display: true, text: 'Date' } },
        y: { title: { display: true, text: 'Daily Cases' }, beginAtZero: true }
      }
    }
  });
}

// -----------------------------
// ANIMATED COUNTERS
// -----------------------------
function animateCounters() {
  document.querySelectorAll('.counter').forEach(counter => {
    const target = Number(counter.dataset.value);
    let current = 0;
    const increment = target / 60;

    const update = () => {
      current += increment;
      if (current < target) {
        counter.textContent = Math.floor(current).toLocaleString();
        requestAnimationFrame(update);
      } else {
        counter.textContent = target.toLocaleString();
      }
    };

    update();
  });
}

// -----------------------------
// COUNTRY SELECT
// -----------------------------
if (countrySelect) {
  countrySelect.addEventListener('change', () => {
    fetchData(countrySelect.value);
  });
}

// -----------------------------
// INIT
// -----------------------------
fetchData();
