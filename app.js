// Migration Helper - Interactive Logic
document.addEventListener('DOMContentLoaded', function() {
  const loadMoreBtn = document.getElementById("loadMoreBtn");

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        loadMoreBtn.click();
      }
    });
  }

  const body = document.body;
  const skipLink = document.createElement('a');
  skipLink.href = '#main';
  skipLink.className = 'skip-to-main';
  skipLink.textContent = 'Skip to main content';
  skipLink.addEventListener('click', function(e) {
    e.preventDefault();
    const main = document.querySelector('main');
    if (main) {
      main.setAttribute('tabindex', '-1');
      main.focus();
    }
  });
  if (body && body.firstChild) {
    body.insertBefore(skipLink, body.firstChild);
  }
});

function announceToScreenReader(message) {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'polite');
  announcement.className = 'visually-hidden';
  announcement.textContent = message;
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

// WORLD CLOCK
const clockCities = [
  { city: "New Delhi", tz: "Asia/Kolkata", flag: "🇮🇳" },
  { city: "Toronto", tz: "America/Toronto", flag: "🇨🇦" },
  { city: "New York", tz: "America/New_York", flag: "🇺🇸" },
  { city: "Trinidad and Tobago", tz: "America/Port_of_Spain", flag: "🇹🇹" },
  { city: "Jakarta", tz: "Asia/Jakarta", flag: "🇮🇩" },
  { city: "Hanoi", tz: "Asia/Ho_Chi_Minh", flag: "🇻🇳" }
];

function formatTimeForTZ(tz) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: tz
  }).format(new Date());
}

function renderWorldClock() {
  const container = document.getElementById("world-clock");
  const clockHTML = clockCities.map(c => {
    return `<div class="clock-item">
      <div><span class="flag">${c.flag}</span>${c.city}</div>
      <div class="time">${formatTimeForTZ(c.tz)}</div>
    </div>`;
  }).join('');
  
  container.innerHTML = clockHTML + clockHTML;
}

renderWorldClock();
setInterval(renderWorldClock, 60 * 1000);

//  CURRENCY CONVERTER

// API Configuration
const API_KEY = '346d06ce5emshf9623f493507c6cp159315jsn8ec2158b7f74';
const API_HOST = 'currency-conversion-and-exchange-rates.p.rapidapi.com';

let exchangeRates = {
  USD: 1,
  CAD: 1.3542,
  INR: 83.50,
  TTD: 6.78,
  COP: 3850.00,
  IDR: 15500.00,
  VND: 23400.00
};

let lastAPIUpdate = null;
let isLoadingRates = false;

// Fetch live exchange rates from RapidAPI
async function fetchLiveRates() {
  if (isLoadingRates) return;
  isLoadingRates = true;
  
  try {
    const response = await fetch(`https://${API_HOST}/latest?base=USD`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': API_KEY,
        'X-RapidAPI-Host': API_HOST
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data.rates) {
      exchangeRates = {
        USD: 1,
        CAD: data.rates.CAD || exchangeRates.CAD,
        INR: data.rates.INR || exchangeRates.INR,
        TTD: data.rates.TTD || exchangeRates.TTD,
        COP: data.rates.COP || exchangeRates.COP,
        IDR: data.rates.IDR || exchangeRates.IDR,
        VND: data.rates.VND || exchangeRates.VND
      };
      lastAPIUpdate = new Date();
      console.log('✅ Live exchange rates updated successfully at', lastAPIUpdate.toLocaleTimeString());
      announceToScreenReader('Exchange rates updated with live data');
    }
  } catch (error) {
    console.warn('⚠️ Failed to fetch live rates, using fallback rates:', error.message);
  } finally {
    isLoadingRates = false;
  }
}

// Fetch rates on page load and refresh every 30 minutes
fetchLiveRates();
setInterval(fetchLiveRates, 30 * 60 * 1000);

function getRate(from, to) {
  const toUSD = 1 / exchangeRates[from];
  const usdToTarget = exchangeRates[to];
  return toUSD * usdToTarget;
}

function formatNumber(n) {
  if (!isFinite(n)) return "—";
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 6 }).format(n);
}

const amountA = document.getElementById("amountA");
const currencyA = document.getElementById("currencyA");
const amountB = document.getElementById("amountB");
const currencyB = document.getElementById("currencyB");
const convertBtn = document.getElementById("convertBtn");
const swapBtn = document.getElementById("swapBtn");
const resultLine = document.getElementById("resultLine");
const rateInfo = document.getElementById("rateInfo");
const amountError = document.getElementById("amountError");

function validateAmount() {
  const v = amountA.value.trim();
  if (v === "") {
    amountError.textContent = "";
    convertBtn.disabled = true;
    return false;
  }
  const normalized = v.replace(/,/g, "");
  if (isNaN(normalized)) {
    amountError.textContent = "Please enter a valid number";
    convertBtn.disabled = true;
    return false;
  }
  amountError.textContent = "";
  convertBtn.disabled = false;
  return true;
}

amountA.addEventListener("input", validateAmount);
currencyA.addEventListener("change", validateAmount);
currencyB.addEventListener("change", validateAmount);

function doConvert() {
  if (!validateAmount()) return;
  const from = currencyA.value;
  const to = currencyB.value;
  const raw = parseFloat(amountA.value.replace(/,/g, ""));
  if (!isFinite(raw)) return;
  const rate = getRate(from, to);
  const converted = raw * rate;
  amountB.value = formatNumber(converted);
  const now = lastAPIUpdate || new Date();
  const resultText = `${formatNumber(raw)} ${from} = ${formatNumber(converted)} ${to}`;
  resultLine.textContent = resultText;
  const lastUpdated = now.toLocaleString(undefined, { 
    dateStyle: 'short', 
    timeStyle: 'medium' 
  });
  const rateSource = lastAPIUpdate ? '🔴 LIVE Rate' : 'Fallback Rate';
  rateInfo.textContent = `${rateSource}: 1 ${from} = ${formatNumber(rate)} ${to} · Updated: ${lastUpdated}`;
  
  announceToScreenReader(`Conversion complete: ${resultText}`);
}

convertBtn.addEventListener("click", doConvert);

amountA.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !convertBtn.disabled) {
    doConvert();
  }
});

swapBtn.addEventListener("click", swapCurrencies);

swapBtn.addEventListener("keydown", (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    swapCurrencies();
  }
});

function swapCurrencies() {
  const aVal = currencyA.value;
  const bVal = currencyB.value;
  currencyA.value = bVal;
  currencyB.value = aVal;
  const amtB = amountB.value;
  amountB.value = "";
  if (validateAmount()) {
    doConvert();
  } else if (amtB) {
    amountA.value = amtB;
    validateAmount();
    doConvert();
  }
}

validateAmount();

// LANGUAGE TABLE
const loadMoreBtn = document.getElementById("loadMoreBtn");
const hiddenRows = document.querySelectorAll(".hidden-row");

if (loadMoreBtn) {
  loadMoreBtn.addEventListener("click", () => {
    hiddenRows.forEach(row => {
      row.classList.remove("hidden-row");
    });
    loadMoreBtn.classList.add("hidden");
    
    announceToScreenReader(`${hiddenRows.length} additional phrases loaded. Total ${7 + hiddenRows.length} phrases now visible.`);
    
    if (hiddenRows.length > 0) {
      const firstNewRow = hiddenRows[0];
      firstNewRow.setAttribute('tabindex', '-1');
      firstNewRow.focus();
      setTimeout(() => firstNewRow.removeAttribute('tabindex'), 100);
    }
  });
}

// PLUGS GALLERY
const defaultCountries = [
  {
    name: "India",
    code: "+91",
    voltage: "230V / 50Hz",
    plugs: ["C", "D", "M"],
    image: "images/India Plug.png"
  },
  {
    name: "Canada",
    code: "+1",
    voltage: "120V / 60Hz",
    plugs: ["A", "B"],
    image: "images/Canada Plug.png"
  },
  {
    name: "United States",
    code: "+1",
    voltage: "120V / 60Hz",
    plugs: ["A", "B"],
    image: "images/US Plug.png"
  },
  {
    name: "Trinidad & Tobago",
    code: "+1 (868)",
    voltage: "115V / 60Hz",
    plugs: ["A", "B"],
    image: "images/TT Plug.png"
  },
  {
    name: "Colombia",
    code: "+57",
    voltage: "110V / 60Hz",
    plugs: ["A", "B", "C"],
    image: "images/Colombia Plug.png"
  },
  {
    name: "Indonesia",
    code: "+62",
    voltage: "230V / 50Hz",
    plugs: ["C", "F"],
    image: "images/Indonesia Plug.png"
  },
  {
    name: "Vietnam",
    code: "+84",
    voltage: "220V / 50Hz",
    plugs: ["A", "C"],
    image: "images/Vietnam Plug.png"
  }
];

const plugTypes = {
  "A": "Type A: Two flat parallel pins",
  "B": "Type B: Two flat parallel pins + grounding pin",
  "C": "Type C: Two round pins (Europlug)",
  "D": "Type D: Three round pins in triangular pattern",
  "F": "Type F: Two round pins with grounding clips",
  "M": "Type M: Three round pins (larger)"
};

function renderPlugGallery() {
  const gallery = document.getElementById("plugGallery");
  gallery.innerHTML = "";
  defaultCountries.forEach(c => {
    const card = document.createElement("div");
    card.className = "card";
    card.setAttribute("role", "listitem");
    const icons = c.plugs.map(p => `<div class="plug-svg" aria-hidden="true" title="${plugTypes[p]}">${p}</div>`).join("");
    const plugDescriptions = c.plugs.map(p => `<li>${plugTypes[p]}</li>`).join("");
    card.innerHTML = `
      <div class="country-image-placeholder">
        <img src="${c.image}" alt="${c.name} electrical plug types" class="country-image" />
      </div>
      <div class="meta">
        <div style="font-weight:700">${c.name}</div>
        <div style="color:#6b7280;font-size:13px">${c.code} · ${c.voltage}</div>
        <div class="plug-icons" aria-hidden="true" style="margin-top:8px">${icons}</div>
        <ul class="plug-descriptions" aria-label="Plug types for ${c.name}">${plugDescriptions}</ul>
      </div>`;
    gallery.appendChild(card);
  });
}

renderPlugGallery();