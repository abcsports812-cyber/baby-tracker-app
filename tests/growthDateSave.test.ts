import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isSameDay, toISODate } from '../src/lib/date';

// Regression guard for the actual root cause of "Growth missing from
// Today's timeline" in the built APK: app/growth/index.tsx's save()
// handler used to serialize the measurement date with
// `date.toISOString().slice(0, 10)`, which is UTC-based. Near a day
// boundary, in any timezone that isn't UTC, that can save a *different*
// calendar date than the one the user actually picked/saw -- so it then
// never matches `isSameDay(record.date, today)` in the timeline filter.
// This sandbox runs in UTC, where the bug is invisible (UTC date and
// local date always agree), which is exactly why the original fix's web
// verification didn't catch it. Overriding TZ here reproduces a real
// device in a non-UTC timezone.
test('a date saved near a day boundary must use the local calendar day, not UTC', () => {
  const originalTZ = process.env.TZ;
  process.env.TZ = 'America/New_York'; // UTC-5: local evening rolls to the next UTC day
  try {
    // 11:30pm local on Jan 10 -- in UTC this is already 4:30am Jan 11.
    const localEvening = new Date(2026, 0, 10, 23, 30, 0);

    const correctlySaved = toISODate(localEvening);
    const buggyOldBehavior = localEvening.toISOString().slice(0, 10);

    assert.equal(correctlySaved, '2026-01-10', 'toISODate must reflect the local calendar day the user was on');
    assert.equal(buggyOldBehavior, '2026-01-11', 'sanity check: toISOString really does roll to the next day here');

    // The actual contract the timeline filter depends on: whatever gets
    // saved as "today" must compare equal to "today" via isSameDay.
    assert.equal(isSameDay(correctlySaved, localEvening), true);
    assert.equal(isSameDay(buggyOldBehavior, localEvening), false, 'the old UTC-based save would have broken this exact check');
  } finally {
    process.env.TZ = originalTZ;
  }
});
