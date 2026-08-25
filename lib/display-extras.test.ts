import { describe, expect, it } from "vitest";
import { isAttachedOptional } from "./display";

describe("isAttachedOptional", () => {
  it("marks feta when listed as optional and present", () => {
    expect(
      isAttachedOptional("Queso feta", [{ name: "Queso feta", qty: 40, unit: "g" }])
    ).toBe(true);
    expect(isAttachedOptional("Arroz", [{ name: "Queso feta", qty: 40, unit: "g" }])).toBe(
      false
    );
  });
});
