"use strict";

/* ---------------------------------------------------------------------
   Constants
--------------------------------------------------------------------- */

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri"];
const DAY_NAMES = {
  mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday",
};
const JS_DAY_TO_KEY = { 1: "mon", 2: "tue", 3: "wed", 4: "thu", 5: "fri" };

const STORAGE_KEY = "class-schedule-data";
const THEME_KEY = "class-schedule-theme";

/* ---------------------------------------------------------------------
   Storage
--------------------------------------------------------------------- */

function emptySchedule() {
  const schedule = {};
  DAY_KEYS.forEach((day) => { schedule[day] = []; });
  return schedule;
}

function loadSchedule() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return emptySchedule();
  try {
    const parsed = JSON.parse(raw);
    const schedule = emptySchedule();
    DAY_KEYS.forEach((day) => {
      if (Array.isArray(parsed[day])) schedule[day] = parsed[day];
    });
    return schedule;
  } catch (e) {
    return emptySchedule();
  }
}

function saveSchedule(schedule) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(schedule));
}

function loadTheme() {
  return localStorage.getItem(THEME_KEY) || "light";
}

function saveTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
}

/* ---------------------------------------------------------------------
   Time helpers
--------------------------------------------------------------------- */

function timeToSeconds(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 3600 + m * 60;
}

function nowToSeconds(date) {
  return date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
}

function formatClockLabel(date) {
  const dayName = date.toLocaleDateString(undefined, { weekday: "long" });
  const time = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${dayName} \u00b7 ${time}`;
}

function formatTimeLabel(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = ((h + 11) % 12) + 1;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}