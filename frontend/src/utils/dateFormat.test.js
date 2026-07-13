import test from "node:test";
import assert from "node:assert/strict";
import { formatGregorianDate } from "./dateFormat.js";


test("Arabic dates always use the Gregorian year", () => {
  const formatted = formatGregorianDate("2026-07-13", "ar");
  assert.match(formatted, /2026/);
  assert.doesNotMatch(formatted, /1447|1448/);
});

