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

function sortedPeriods(periods) {
  return [...periods].sort((a, b) => timeToSeconds(a.start) - timeToSeconds(b.start));
}

/* ---------------------------------------------------------------------
   Schedule state: figures out what's happening right now
--------------------------------------------------------------------- */

function computeState(periods, now) {
  const jsDay = now.getDay();
  const dayKey = JS_DAY_TO_KEY[jsDay];

  if (!dayKey) {
    return { status: "weekend" };
  }

  const todays = sortedPeriods(periods[dayKey] || []);
  if (todays.length === 0) {
    return { status: "empty", dayKey };
  }

  const nowSeconds = nowToSeconds(now);

  for (let i = 0; i < todays.length; i++) {
    const period = todays[i];
    const start = timeToSeconds(period.start);
    const end = timeToSeconds(period.end);

    if (nowSeconds >= start && nowSeconds < end) {
      const next = todays[i + 1] || null;
      return {
        status: "in-class",
        dayKey,
        current: period,
        remainingSeconds: end - nowSeconds,
        next,
      };
    }

    if (nowSeconds < start) {
      const isFirst = i === 0;
      return {
        status: isFirst ? "before-school" : "break",
        dayKey,
        next: period,
        remainingSeconds: start - nowSeconds,
      };
    }
  }

  return { status: "done", dayKey };
}

/* ---------------------------------------------------------------------
   Rendering: now panel
--------------------------------------------------------------------- */

function renderNowPanel(schedule, now) {
  const clockLine = document.getElementById("clockLine");
  const stateLine = document.getElementById("stateLine");
  const countdownLine = document.getElementById("countdownLine");
  const subLine = document.getElementById("subLine");

  clockLine.textContent = formatClockLabel(now);

  const state = computeState(schedule, now);

  if (state.status === "weekend") {
    stateLine.textContent = "No school today";
    countdownLine.textContent = "\u2014";
    subLine.textContent = "Enjoy the weekend.";
    return;
  }

  if (state.status === "empty") {
    stateLine.textContent = "Nothing scheduled today";
    countdownLine.textContent = "\u2014";
    subLine.textContent = "Add today's periods in the editor below.";
    return;
  }

  if (state.status === "in-class") {
    stateLine.textContent = state.current.name;
    countdownLine.textContent = formatDuration(state.remainingSeconds);
    subLine.textContent = state.next
      ? `Then ${state.next.name} at ${formatTimeLabel(state.next.start)}`
      : "Last period of the day";
    return;
  }

  if (state.status === "before-school") {
    stateLine.textContent = "Not started yet";
    countdownLine.textContent = formatDuration(state.remainingSeconds);
    subLine.textContent = `Until ${state.next.name} at ${formatTimeLabel(state.next.start)}`;
    return;
  }

  if (state.status === "break") {
    stateLine.textContent = "Between classes";
    countdownLine.textContent = formatDuration(state.remainingSeconds);
    subLine.textContent = `Until ${state.next.name} at ${formatTimeLabel(state.next.start)}`;
    return;
  }

  if (state.status === "done") {
    stateLine.textContent = "That's it for today";
    countdownLine.textContent = "\u2014";
    subLine.textContent = "No more periods left today.";
  }
}

/* ---------------------------------------------------------------------
   Rendering: today's list
--------------------------------------------------------------------- */

function renderTodayList(schedule, now) {
  const list = document.getElementById("todayList");
  const emptyNote = document.getElementById("todayEmptyNote");
  const dayKey = JS_DAY_TO_KEY[now.getDay()];

  list.innerHTML = "";

  if (!dayKey || (schedule[dayKey] || []).length === 0) {
    emptyNote.hidden = false;
    return;
  }
  emptyNote.hidden = true;

  const nowSeconds = nowToSeconds(now);
  const todays = sortedPeriods(schedule[dayKey]);

  todays.forEach((period) => {
    const start = timeToSeconds(period.start);
    const end = timeToSeconds(period.end);

    const row = document.createElement("li");
    row.className = "period-list__row";
    if (nowSeconds >= start && nowSeconds < end) {
      row.classList.add("period-list__row--current");
    } else if (nowSeconds >= end) {
      row.classList.add("period-list__row--past");
    }

    const time = document.createElement("span");
    time.className = "period-list__time";
    time.textContent = `${formatTimeLabel(period.start)} \u2013 ${formatTimeLabel(period.end)}`;

    const name = document.createElement("span");
    name.className = "period-list__name";
    name.textContent = period.name;

    row.append(time, name);
    list.append(row);
  });
}

/* ---------------------------------------------------------------------
   Rendering: editor
--------------------------------------------------------------------- */

let activeDay = "mon";
let schedule = loadSchedule();

function renderDayTabs() {
  document.querySelectorAll(".day-tabs__tab").forEach((tab) => {
    const isActive = tab.dataset.day === activeDay;
    tab.setAttribute("aria-selected", isActive ? "true" : "false");
  });
}