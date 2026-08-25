import { describe, expect, it } from "vitest";
import { formatShortDate } from "./display";

describe("formatShortDate", () => {
  it("formats ISO dates in short Spanish without locale APIs", () => {
    expect(formatShortDate("2026-08-25")).toBe("mar 25 ago");
    expect(formatShortDate("2026-08-24")).toBe("lun 24 ago");
  });
});
