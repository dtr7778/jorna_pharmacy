import { describe, expect, it } from "vitest";

import {
  getMedicineTypeIcon,
  MEDICINE_TYPE_OPTIONS,
} from "./medicine.constants";

describe("getMedicineTypeIcon", () => {
  it("returns an icon for every medicine type", () => {
    for (const option of MEDICINE_TYPE_OPTIONS) {
      expect(getMedicineTypeIcon(option.value)).toBeDefined();
    }
  });

  it("gives each medicine type its own icon", () => {
    const icons = MEDICINE_TYPE_OPTIONS.map((option) =>
      getMedicineTypeIcon(option.value)
    );

    expect(new Set(icons).size).toBe(icons.length);
  });
});
