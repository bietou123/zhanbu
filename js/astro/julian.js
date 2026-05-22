/* ============================================================
 *  Julian Day 转换 (Meeus, Astronomical Algorithms, Ch.7)
 *  - JD 始终以 UT (世界时) 为基准，不带时区。
 *  - 调用方负责把"当地时间 + 时区偏移"先换算成 UT 时间分量再调用 dateToJD。
 *  - 这样能干净地把"日历问题"和"时区问题"解耦。
 * ============================================================ */
(function (global) {
  'use strict';

  function dateToJD(year, month, day, hour, minute, second) {
    // 默认时分秒
    hour = hour || 0; minute = minute || 0; second = second || 0;
    const dayFrac = day + (hour + minute / 60 + second / 3600) / 24;

    let Y = year, M = month;
    if (M <= 2) { Y -= 1; M += 12; }

    // 1582-10-15 起为公历；本工具只服务于 1900+ 范围，但保留判断
    let B = 0;
    if (year > 1582 || (year === 1582 && (month > 10 || (month === 10 && day >= 15)))) {
      const A = Math.floor(Y / 100);
      B = 2 - A + Math.floor(A / 4);
    }
    return Math.floor(365.25 * (Y + 4716)) +
           Math.floor(30.6001 * (M + 1)) +
           dayFrac + B - 1524.5;
  }

  function jdToDate(jd) {
    jd += 0.5;
    const Z = Math.floor(jd);
    const F = jd - Z;
    let A;
    if (Z < 2299161) {
      A = Z;
    } else {
      const alpha = Math.floor((Z - 1867216.25) / 36524.25);
      A = Z + 1 + alpha - Math.floor(alpha / 4);
    }
    const B = A + 1524;
    const C = Math.floor((B - 122.1) / 365.25);
    const D = Math.floor(365.25 * C);
    const E = Math.floor((B - D) / 30.6001);

    const dayWithFrac = B - D - Math.floor(30.6001 * E) + F;
    const day = Math.floor(dayWithFrac);
    const frac = dayWithFrac - day;

    const month = E < 14 ? E - 1 : E - 13;
    const year = month > 2 ? C - 4716 : C - 4715;

    const totalSec = Math.round(frac * 86400);
    const hour = Math.floor(totalSec / 3600);
    const minute = Math.floor((totalSec - hour * 3600) / 60);
    const second = totalSec - hour * 3600 - minute * 60;

    return { year, month, day, hour, minute, second };
  }

  // 把当地时间 + 时区偏移(小时) 转为 UT 的 JD
  function localToJD_UT(year, month, day, hour, minute, second, tzOffsetHours) {
    // UT = local - tzOffset
    const tzSec = (tzOffsetHours || 0) * 3600;
    const localSec = hour * 3600 + minute * 60 + second;
    let utSec = localSec - tzSec;
    let dayShift = 0;
    while (utSec < 0) { utSec += 86400; dayShift -= 1; }
    while (utSec >= 86400) { utSec -= 86400; dayShift += 1; }
    const utH = Math.floor(utSec / 3600);
    const utM = Math.floor((utSec - utH * 3600) / 60);
    const utS = utSec - utH * 3600 - utM * 60;
    return dateToJD(year, month, day + dayShift, utH, utM, utS);
  }

  // 把 UT 的 JD 转换成指定时区的日历时间
  function jdToLocalDate(jd, tzOffsetHours) {
    return jdToDate(jd + (tzOffsetHours || 0) / 24);
  }

  // 格式化（按某时区显示）
  function formatJD(jd, tzOffsetHours, withSec) {
    const d = jdToLocalDate(jd, tzOffsetHours);
    const pad = n => String(n).padStart(2, '0');
    const base = `${d.year}-${pad(d.month)}-${pad(d.day)} ${pad(d.hour)}:${pad(d.minute)}`;
    return withSec ? `${base}:${pad(d.second)}` : base;
  }

  global.Julian = { dateToJD, jdToDate, localToJD_UT, jdToLocalDate, formatJD };
})(window);
