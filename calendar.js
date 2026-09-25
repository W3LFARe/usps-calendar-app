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

// The 6-week rotation cycle starting with Monday = Blue
// 0: Blue, 1: Orange, 2: Green, 3: Purple, 4: Black, 5: Red
const colors = ["blue", "orange", "green", "purple", "black", "red"];

// COLOR ANCHOR: Monday, January 4, 2027 is BLUE.
// This ensures Jan 1, 2027 (Friday) is RED, and the pattern flows correctly.
const anchorDate = new Date(2027, 0, 4, 12, 0, 0); 
const anchorIndex = 0; // Blue

const rotationCache = new Map();

function getColorClass(date) {
  const d = date.getDay();
  
  // 1. Sunday is always gray/off
  if (d === 0) return "sunday";
  
  // 2. Saturday always matches Friday
  if (d === 6) {
    const fri = new Date(date);
    fri.setDate(fri.getDate() - 1);
    return getColorClass(fri);
  }

  // 3. Monday - Friday: Calculate based on the week number
  // Create a clean date at noon to avoid timezone shifts
  const cleanDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
  const key = cleanDate.getTime();
  
  if (rotationCache.has(key)) return rotationCache.get(key);

  // Find the Monday of the current week
  const currentMonday = new Date(cleanDate);
  currentMonday.setDate(cleanDate.getDate() - cleanDate.getDay() + 1);

  // Calculate difference in weeks between current Monday and Anchor Monday
  const msPerWeek = 604800000; // 1000 * 60 * 60 * 24 * 7
  const weeksDiff = Math.round((currentMonday - anchorDate) / msPerWeek);

  // Determine the color index for this Monday
  let weekColorIndex = (anchorIndex + weeksDiff) % colors.length;
  if (weekColorIndex < 0) weekColorIndex += colors.length;

  // Determine the color for the specific day (Mon=0, Tue=1, Wed=2, Thu=3, Fri=4)
  const dayOffset = d - 1; 
  const finalColorIndex = (weekColorIndex + dayOffset) % colors.length;
  const color = colors[finalColorIndex];

  rotationCache.set(key, color);
  return color;
}

// Calculate USPS Paydays (Bi-weekly on Fridays)
// PAYDAY ANCHOR: January 15, 2027 is a Payday. 
// This aligns with the 2027 PDF and calculates backwards to Jan 2, 2026 for the 2026 PDF.
function getPaydays(year) {
  const paydays = new Set();
  const anchor = new Date(2027, 0, 15, 12, 0, 0); 
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
  
  grid.innerHTML = "";

  const weekdayHeader = `<div class="weekdays">${
    ["S","M","T","W","T","F","S"].map(ch => `<div>${ch}</div>`).join("")
  }</div>`;

  const today = new Date();
  const todayDate = today.getDate();
  const todayMonth = today.getMonth();
  const todayYear = today.getFullYear();

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