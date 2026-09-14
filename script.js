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