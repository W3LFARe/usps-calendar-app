// calendar.js
import { getUSPSHolidays } from "./dynamicHolidays.js";

export function populateYearDropdown(selectElement, defaultYear) {
  for (let y = 2025; y <= 2050; y++) {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    if (y === defaultYear) opt.selected = true;
    selectElement.appendChild(opt);
  }
}

const colors      = ["orange", "green", "purple", "black", "red", "blue"];
const anchorDate  = new Date(2024, 11, 31); // Dec 31, 2024
const anchorIndex = colors.indexOf("black");

const rotationCache = new Map();

function getRotationIndex(date) {
  const key = date.toISOString().slice(0, 10);
  if (rotationCache.has(key)) return rotationCache.get(key);

  let idx = anchorIndex;
  const cur = new Date(anchorDate);
  while (cur < date) {
    cur.setDate(cur.getDate() + 1);
    const d = cur.getDay();
    if (d >= 1 && d <= 5) idx = (idx + 1) % colors.length;
  }

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

export function renderCalendar(selectedYear) {
  const grid = document.getElementById("calendar-grid");
  const uspsHolidays = getUSPSHolidays(selectedYear);
  grid.innerHTML = "";
  rotationCache.clear();

  // Title update (for tab)
  document.title = `USPS Calendar – ${selectedYear}`;

  // Inject a centered year label ONLY used for print
const printLabel = document.createElement("div");
printLabel.className = "year-print-banner";
printLabel.textContent = selectedYear;
grid.appendChild(printLabel);



  const weekdayHeader = `<div class="weekdays">${
    ["S","M","T","W","T","F","S"].map(ch => `<div>${ch}</div>`).join("")
  }</div>`;

  for (let month = 0; month < 12; month++) {
    const md = document.createElement("div");
    md.className = "month";

    const monthName = new Date(selectedYear, month, 1)
      .toLocaleString("default", { month: "long" });

    let html = `<h2>${monthName}</h2>${weekdayHeader}<div class="days">`;

    const firstDow = new Date(selectedYear, month, 1).getDay();
    html += "<div class='day empty'></div>".repeat(firstDow);

    const dim = new Date(selectedYear, month + 1, 0).getDate();
    for (let d = 1; d <= dim; d++) {
      const dt  = new Date(selectedYear, month, d),
            iso = dt.toISOString().slice(0, 10);

      let cls = `day ${getColorClass(dt)}`;
      if (uspsHolidays[iso]) cls += " holiday";

      html += `<div class="${cls}" title="${uspsHolidays[iso] || ""}">${d}</div>`;
    }

    html += "</div>";
    md.innerHTML = html;
    grid.appendChild(md);
  }
}
