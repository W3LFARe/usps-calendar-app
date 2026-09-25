// calendar.js
import { getUSPSHolidays } from "./dynamicHolidays.js";

export function populateYearDropdown(selectElement, defaultYear) {
  const fragment = document.createDocumentFragment();
  for (let y = 2025; y <= 2050; y++) {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    if (y === defaultYear) opt.selected = true;
    fragment.appendChild(opt);
  }
  selectElement.appendChild(fragment);
}

// Color array matches the PDF style
const colors = ["orange", "green", "purple", "black", "red", "blue"];

// Anchor set to make 2027 the PURPLE schedule
const anchorDate = new Date(2024, 11, 31); 
const anchorIndex = colors.indexOf("green"); 

const rotationCache = new Map();

function getRotationIndex(date) {
  const key = date.toISOString().slice(0, 10);
  if (rotationCache.has(key)) return rotationCache.get(key);

  const msPerDay = 86400000;
  const diffDays = Math.round((date - anchorDate) / msPerDay);
  let weekdays = 0;
  const cur = new Date(anchorDate);
  
  if (diffDays < 0) {
    for (let i = 0; i > diffDays; i--) {
      cur.setDate(cur.getDate() - 1);
      if (cur.getDay() >= 1 && cur.getDay() <= 5) weekdays--;
    }
  } else {
    for (let i = 0; i < diffDays; i++) {
      cur.setDate(cur.getDate() + 1);
      if (cur.getDay() >= 1 && cur.getDay() <= 5) weekdays++;
    }
  }

  let idx = (anchorIndex + weekdays) % colors.length;
  if (idx < 0) idx += colors.length;
  
  rotationCache.set(key, idx);
  return idx;
}

function getColorClass(date) {
  const d = date.getDay();
  if (d === 0) return "sunday";
  if (d === 6) {
    const fri = new Date(date);
    fri.setDate(fri.getDate() - 1);
    return colors[getRotationIndex(fri)];
  }
  return colors[getRotationIndex(date)];
}

// Calculate USPS Paydays (Bi-weekly on Fridays)
function getPaydays(year) {
  const paydays = new Set();
  // Anchor: Jan 15, 2027 is a known USPS payday (Friday)
  const anchor = new Date(2027, 0, 15);
  const msPerDay = 86400000;
  const msPerPayPeriod = 14 * msPerDay;

  let current = new Date(anchor);
  
  while (current.getFullYear() <= year + 1) {
    if (current.getFullYear() === year) {
      paydays.add(current.toISOString().slice(0, 10));
    }
    current = new Date(current.getTime() + msPerPayPeriod);
  }
  
  current = new Date(anchor);
  while (current.getFullYear() >= year - 1) {
    if (current.getFullYear() === year) {
      paydays.add(current.toISOString().slice(0, 10));
    }
    current = new Date(current.getTime() - msPerPayPeriod);
  }
  
  return paydays;
}

export function renderCalendar(selectedYear) {
  const grid = document.getElementById("calendar-grid");
  const uspsHolidays = getUSPSHolidays(selectedYear);
  const paydays = getPaydays(selectedYear);
  
  // Clear grid completely
  grid.innerHTML = "";

  const weekdayHeader = `<div class="weekdays">${
    ["S","M","T","W","T","F","S"].map(ch => `<div>${ch}</div>`).join("")
  }</div>`;

  const today = new Date();
  const todayDate = today.getDate();
  const todayMonth = today.getMonth();
  const todayYear = today.getFullYear();

  // Render ONLY the 12 months into the grid
  for (let month = 0; month < 12; month++) {
    const md = document.createElement("div");
    md.className = "month";
    const monthName = new Date(selectedYear, month, 1).toLocaleString("default", { month: "long" }).toUpperCase();

    let html = `<h2 class="month-title">${monthName}</h2>${weekdayHeader}<div class="days">`;
    const firstDow = new Date(selectedYear, month, 1).getDay();
    html += "<div class='day empty'></div>".repeat(firstDow);

    const dim = new Date(selectedYear, month + 1, 0).getDate();
    for (let d = 1; d <= dim; d++) {
      const dt = new Date(selectedYear, month, d);
      const iso = dt.toISOString().slice(0, 10);
      const holiday = uspsHolidays[iso];
      const isPayday = paydays.has(iso);

      let cls = `day ${getColorClass(dt)}`;
      if (holiday) cls += " holiday";
      if (d === todayDate && month === todayMonth && selectedYear === todayYear) cls += " today";

      const title = `${holiday ? holiday + ' - ' : ''}${monthName} ${d}, ${selectedYear}${isPayday ? ' (Payday)' : ''}`;
      
      html += `<div class="${cls}" title="${title}" role="gridcell" aria-label="${title}">
                 <span class="date-num">${d}</span>
                 ${isPayday ? '<span class="payday-p">P</span>' : ''}
               </div>`;
    }

    html += "</div>";
    md.innerHTML = html;
    grid.appendChild(md);
  }

  document.title = `USPS Calendar – ${selectedYear}`;
}