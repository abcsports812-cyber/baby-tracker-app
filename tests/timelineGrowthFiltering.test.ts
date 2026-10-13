import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isSameDay, toISODate } from '../src/lib/date';

// Growth records are saved with a bare "YYYY-MM-DD" date (see
// app/growth/index.tsx's `date.toISOString().slice(0, 10)`), the same
// shape used by health/appointments/etc. Today's timeline (and the
// calendar's selected-date timeline, which shares the same filter) must
// only ever show a growth measurement on the exact day it was recorded --
// never bleed into an adjacent day because of UTC/local timezone
// conversion. This exercises the same date handling the Home dashboard's
// useTimelineEvents() relies on for growth.

test('a growth measurement recorded today is matched against "today"', () => {
  const today = new Date();
  const todayDateOnly = toISODate(today);
  assert.equal(isSameDay(todayDateOnly, today), true);
});

test('a growth measurement from yesterday is not shown as today', () => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayDateOnly = toISODate(yesterday);
  assert.equal(isSameDay(yesterdayDateOnly, today), false);
});

test('a growth measurement from last month is not shown as today', () => {
  const today = new Date();
  const lastMonth = new Date(today);
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  assert.equal(isSameDay(toISODate(lastMonth), today), false);
});

test('same calendar day matches regardless of time-of-day component', () => {
  const morning = new Date(2026, 0, 10, 6, 0, 0);
  const night = new Date(2026, 0, 10, 23, 30, 0);
  assert.equal(isSameDay('2026-01-10', morning), true);
  assert.equal(isSameDay('2026-01-10', night), true);
});

test('a bare date string does not drift to the previous day (local-midnight parsing)', () => {
  // Regression guard for the UTC-midnight parsing bug this codebase has
  // already hit once for teeth eruption dates (see src/lib/date.ts toDate
  // comment) -- growth shares the exact same bare-date storage format, so
  // it is equally exposed if toDate() regresses.
  const localMidnightToday = new Date();
  localMidnightToday.setHours(0, 0, 0, 0);
  const dateOnly = toISODate(localMidnightToday);
  assert.equal(isSameDay(dateOnly, localMidnightToday), true);
});

test('year boundary: Dec 31 is not the same day as Jan 1', () => {
  assert.equal(isSameDay('2025-12-31', new Date(2026, 0, 1)), false);
});
