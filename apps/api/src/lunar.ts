// Vietnamese lunar → solar date conversion, so lunar occasions (Tết, Trung thu, Thất tịch) land on
// the right day every year without anyone editing them.
//
// Astronomical algorithm by Hồ Ngọc Đức ("Âm lịch Việt Nam", based on Jean Meeus, Astronomical
// Algorithms), computed for the Vietnam time zone (UTC+7). Verified against known dates in
// scripts run during development (Tết 2024–2027, Trung thu and Thất tịch 2024–2026).

const TIME_ZONE = 7;

function jdFromDate(day: number, month: number, year: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  let jd = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  if (jd < 2299161) jd = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083;
  return jd;
}

function jdToDate(jd: number): { day: number; month: number; year: number } {
  let b: number;
  let c: number;
  if (jd > 2299160) {
    const a = jd + 32044;
    b = Math.floor((4 * a + 3) / 146097);
    c = a - Math.floor((b * 146097) / 4);
  } else {
    b = 0;
    c = jd + 32082;
  }
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  return {
    day: e - Math.floor((153 * m + 2) / 5) + 1,
    month: m + 3 - 12 * Math.floor(m / 10),
    year: b * 100 + d - 4800 + Math.floor(m / 10),
  };
}

/** Julian day of the k-th new moon after 1900-01-01. */
function newMoon(k: number): number {
  const T = k / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;
  const dr = Math.PI / 180;
  let jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
  jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
  let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
  C1 = C1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr);
  C1 = C1 - 0.0004 * Math.sin(dr * 3 * Mpr);
  C1 = C1 + 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr));
  C1 = C1 - 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M));
  C1 = C1 - 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr));
  C1 = C1 + 0.001 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));
  const deltaT =
    T < -11
      ? 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3
      : -0.000278 + 0.000265 * T + 0.000262 * T2;
  return jd1 + C1 - deltaT;
}

/** Sun longitude in radians at a Julian day. */
function sunLongitude(jdn: number): number {
  const T = (jdn - 2451545.0) / 36525;
  const T2 = T * T;
  const dr = Math.PI / 180;
  const M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  let DL = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
  DL = DL + (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.00029 * Math.sin(dr * 3 * M);
  let L = (L0 + DL) * dr;
  L = L - Math.PI * 2 * Math.floor(L / (Math.PI * 2));
  return L;
}

const sunSegment = (dayNumber: number) => Math.floor((sunLongitude(dayNumber - 0.5 - TIME_ZONE / 24) / Math.PI) * 6);
const newMoonDay = (k: number) => Math.floor(newMoon(k) + 0.5 + TIME_ZONE / 24);

/** Julian day of the start of lunar month 11 (the month containing the winter solstice) of `year`. */
function lunarMonth11(year: number): number {
  const off = jdFromDate(31, 12, year) - 2415021;
  const k = Math.floor(off / 29.530588853);
  const nm = newMoonDay(k);
  return sunSegment(nm) >= 9 ? newMoonDay(k - 1) : nm;
}

function leapMonthOffset(a11: number): number {
  const k = Math.floor((a11 - 2415021.076998695) / 29.530588853 + 0.5);
  let i = 1;
  let arc = sunSegment(newMoonDay(k + i));
  let last: number;
  do {
    last = arc;
    i++;
    arc = sunSegment(newMoonDay(k + i));
  } while (arc !== last && i < 14);
  return i - 1;
}

/**
 * Solar date of a (non-leap) lunar day/month in lunar year `lunarYear`, as "YYYY-MM-DD".
 * Lunar day 30 does not exist in short months; it then falls on the next month's first day,
 * which is the usual convention for anniversaries on day 30.
 */
export function lunarToSolar(lunarDay: number, lunarMonth: number, lunarYear: number): string {
  let a11: number;
  let b11: number;
  if (lunarMonth < 11) {
    a11 = lunarMonth11(lunarYear - 1);
    b11 = lunarMonth11(lunarYear);
  } else {
    a11 = lunarMonth11(lunarYear);
    b11 = lunarMonth11(lunarYear + 1);
  }
  const k = Math.floor(0.5 + (a11 - 2415021.076998695) / 29.530588853);
  let off = lunarMonth - 11;
  if (off < 0) off += 12;
  // A year with 13 lunar months has a leap month; months from it onwards shift by one.
  if (b11 - a11 > 365 && off >= leapMonthOffset(a11)) off += 1;
  const { day, month, year } = jdToDate(newMoonDay(k + off) + lunarDay - 1);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
