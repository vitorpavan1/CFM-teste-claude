// B3 (Brazilian Stock Exchange) holidays and business day utilities

/**
 * Calculates Easter Sunday for a given year using the Anonymous Gregorian algorithm
 */
function getEasterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Returns a list of B3 holidays for a given year
 * Includes: National holidays + B3-specific closures
 */
function getB3Holidays(year: number): Date[] {
  const holidays: Date[] = [];

  // Fixed national holidays
  holidays.push(new Date(Date.UTC(year, 0, 1)));   // New Year's Day
  holidays.push(new Date(Date.UTC(year, 3, 21)));  // Tiradentes Day
  holidays.push(new Date(Date.UTC(year, 4, 1)));   // Labor Day
  holidays.push(new Date(Date.UTC(year, 8, 7)));   // Independence Day
  holidays.push(new Date(Date.UTC(year, 9, 12)));  // Our Lady of Aparecida
  holidays.push(new Date(Date.UTC(year, 10, 2)));  // All Souls' Day
  holidays.push(new Date(Date.UTC(year, 10, 15))); // Proclamation of the Republic
  holidays.push(new Date(Date.UTC(year, 10, 20))); // Black Consciousness Day (since 2024)
  holidays.push(new Date(Date.UTC(year, 11, 25))); // Christmas

  // Movable holidays (based on Easter)
  const easter = getEasterSunday(year);
  const easterTime = easter.getTime();

  // Carnival (47 days before Easter)
  const carnival = new Date(easterTime - 47 * 24 * 60 * 60 * 1000);
  holidays.push(carnival);

  // Good Friday (2 days before Easter)
  const goodFriday = new Date(easterTime - 2 * 24 * 60 * 60 * 1000);
  holidays.push(goodFriday);

  // Corpus Christi (60 days after Easter)
  const corpusChristi = new Date(easterTime + 60 * 24 * 60 * 60 * 1000);
  holidays.push(corpusChristi);

  // Special B3 closures
  holidays.push(new Date(Date.UTC(year, 11, 24))); // Christmas Eve (afternoon closure, counted as holiday)
  holidays.push(new Date(Date.UTC(year, 11, 31))); // New Year's Eve (afternoon closure, counted as holiday)

  return holidays;
}

/**
 * Checks if a given date is a B3 holiday
 */
export function isB3Holiday(date: Date): boolean {
  const year = date.getUTCFullYear();
  const holidays = getB3Holidays(year);

  const dateStr = date.toISOString().split('T')[0];
  return holidays.some(holiday => holiday.toISOString().split('T')[0] === dateStr);
}

/**
 * Checks if a given date is a weekend (Saturday or Sunday)
 */
export function isWeekend(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
}

/**
 * Checks if a given date is a business day (not weekend and not holiday)
 */
export function isBusinessDay(date: Date): boolean {
  return !isWeekend(date) && !isB3Holiday(date);
}

/**
 * Returns the next business day after the given date
 */
export function getNextBusinessDay(date: Date): Date {
  let nextDay = new Date(date.getTime() + 24 * 60 * 60 * 1000);
  while (!isBusinessDay(nextDay)) {
    nextDay = new Date(nextDay.getTime() + 24 * 60 * 60 * 1000);
  }
  return nextDay;
}

/**
 * Adjusts a date to the next business day if it falls on a non-business day
 */
export function adjustToBusinessDay(date: Date): Date {
  if (isBusinessDay(date)) {
    return date;
  }
  return getNextBusinessDay(date);
}

/**
 * Calculates the number of business days between two dates (inclusive)
 */
export function getBusinessDaysBetween(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate.getTime());

  while (current.getTime() <= endDate.getTime()) {
    if (isBusinessDay(current)) {
      count++;
    }
    current.setTime(current.getTime() + 24 * 60 * 60 * 1000);
  }

  return count;
}
