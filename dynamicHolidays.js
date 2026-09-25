// dynamicHolidays.js
import { uspsHolidaysByYear } from "./holidays.js";

export function getUSPSHolidays(year) {
  // O(1) lookup for known years
  if (uspsHolidaysByYear[year]) return uspsHolidaysByYear[year];
  return computeHolidaysDynamic(year);
}

function computeHolidaysDynamic(year) {
  const iso = (d) => d.toISOString().slice(0, 10);

  function nthWeekdayOfMonth(n, weekday, month) {
    const d = new Date(year, month, 1);
    let count = 0;
    while (true) {
      if (d.getDay() === weekday) count++;
      if (count === n) return d;
      d.setDate(d.getDate() + 1);
    }
  }

  function lastWeekdayOfMonth(weekday, month) {
    const d = new Date(year, month + 1, 0);
    while (d.getDay() !== weekday) d.setDate(d.getDate() - 1);
    return d;
  }

  function observed(d) {
    const dow = d.getDay();
    if (dow === 6) return new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1);
    if (dow === 0) return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    return d;
  }

  const hols = {};

  [
    ["New Year's Day", new Date(year, 0, 1)],
    ["Juneteenth", new Date(year, 5, 19)],
    ["Independence Day", new Date(year, 6, 4)],
    ["Veterans Day", new Date(year, 10, 11)],
    ["Christmas Day", new Date(year, 11, 25)],
  ].forEach(([name, dt]) => {
    hols[iso(observed(dt))] = name;
  });

  hols[iso(nthWeekdayOfMonth(3, 1, 0))] = "Martin Luther King Jr. Day";
  hols[iso(nthWeekdayOfMonth(3, 1, 1))] = "Presidents Day";
  hols[iso(lastWeekdayOfMonth(1, 4))] = "Memorial Day";
  hols[iso(nthWeekdayOfMonth(1, 1, 6))] = "Labor Day";
  hols[iso(nthWeekdayOfMonth(2, 1, 9))] = "Columbus Day";
  hols[iso(nthWeekdayOfMonth(4, 4, 10))] = "Thanksgiving";

  return hols;
}