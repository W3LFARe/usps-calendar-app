// dynamicHolidays.js
/**
 * Returns an object mapping ISO dates → holiday names
 * for all USPS-observed federal holidays in the given year.
 */
export function getUSPSHolidays(year) {
  const iso = (d) => d.toISOString().slice(0,10);

  // Helper: nth weekday of month (e.g. 3rd Monday of Jan)
  function nthWeekdayOfMonth(n, weekday, month) {
    const d = new Date(year, month, 1);
    let count = 0;
    while (true) {
      if (d.getDay() === weekday) count++;
      if (count === n) return d;
      d.setDate(d.getDate() + 1);
    }
  }
  
  // Helper: last weekday of month (e.g. last Monday of May)
  function lastWeekdayOfMonth(weekday, month) {
    const d = new Date(year, month+1, 0); // last day
    while (d.getDay() !== weekday) {
      d.setDate(d.getDate() - 1);
    }
    return d;
  }

  // Shift if holiday falls on weekend
  function observed(d) {
    const dow = d.getDay();
    if (dow === 6) return new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1);
    if (dow === 0) return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    return d;
  }

  const hols = {};

  // Fixed-date holidays
  [
    ["New Year's Day",      new Date(year,0,1)],
    ["Juneteenth",          new Date(year,5,19)],
    ["Independence Day",    new Date(year,6,4)],
    ["Veterans Day",        new Date(year,10,11)],
    ["Christmas Day",       new Date(year,11,25)]
  ].forEach(([name, dt]) => {
    hols[iso(observed(dt))] = name;
  });

  // Floating holidays
  hols[iso(nthWeekdayOfMonth(3,1,0))]  = "Martin Luther King Jr. Day";  // Jan, 3rd Mon
  hols[iso(nthWeekdayOfMonth(3,1,1))]  = "Presidents Day";                // Feb, 3rd Mon
  hols[iso(lastWeekdayOfMonth(1,4))]   = "Memorial Day";                  // May, last Mon
  hols[iso(nthWeekdayOfMonth(1,1,6))]  = "Labor Day";                     // Sept, 1st Mon
  hols[iso(nthWeekdayOfMonth(2,1,9))]  = "Columbus Day";                  // Oct, 2nd Mon
  hols[iso(nthWeekdayOfMonth(4,4,10))] = "Thanksgiving";                  // Nov, 4th Thu

  return hols;
}
