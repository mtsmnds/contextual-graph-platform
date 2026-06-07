import { describe, it, expect } from "vitest";
import { snap16, snapCanvasDim, GRID } from "./useGraphStore";

describe("GRID", () => {
  it("is 16", () => {
    expect(GRID).toBe(16);
  });
});

describe("snap16", () => {
  it("snaps exact multiples to themselves", () => {
    expect(snap16(0)).toBe(0);
    expect(snap16(16)).toBe(16);
    expect(snap16(32)).toBe(32);
  });

  it("rounds up to next grid multiple", () => {
    expect(snap16(1)).toBe(16);
    expect(snap16(15)).toBe(16);
    expect(snap16(17)).toBe(32);
    expect(snap16(31)).toBe(32);
  });

  it("handles fractional numbers", () => {
    expect(snap16(4.5)).toBe(16);
    expect(snap16(20.2)).toBe(32);
  });
});

describe("snapCanvasDim", () => {
  it("snaps width and height", () => {
    const result = snapCanvasDim({ x: 0, y: 0, width: 15, height: 31 });
    expect(result.width).toBe(16);
    expect(result.height).toBe(32);
  });

  it("preserves x and y as-is", () => {
    const result = snapCanvasDim({ x: 5, y: 10, width: 16, height: 16 });
    expect(result.x).toBe(5);
    expect(result.y).toBe(10);
  });
});
