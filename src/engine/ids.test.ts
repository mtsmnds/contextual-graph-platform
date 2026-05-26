import { describe, it, expect } from "vitest";
import { slugify, generateEntityId, generateUniqueId, generateDocId } from "./ids";

describe("slugify", () => {
  it("lowercases and removes spaces", () => {
    expect(slugify("Hello World")).toBe("helloworld");
  });

  it("removes punctuation including apostrophes and question marks", () => {
    expect(slugify("What's up?")).toBe("whatsup");
  });

  it("removes diacritics", () => {
    expect(slugify("Café déjà vu")).toBe("cafedejavu");
  });

  it("collapses multiple hyphens (spaces become hyphens then are removed)", () => {
    expect(slugify("a  b")).toBe("ab");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("--hello--")).toBe("hello");
  });

  it("returns 'untitled' for empty input", () => {
    expect(slugify("")).toBe("untitled");
  });

  it("handles em-dash, curly quotes, and ellipsis", () => {
    expect(slugify("— Hamlet's Soliloquy…")).toBe("hamletssoliloquy");
  });
});

describe("generateDocId", () => {
  it("starts with doc_ prefix", () => {
    expect(generateDocId()).toMatch(/^doc_\d+$/);
  });
});

describe("generateEntityId", () => {
  it("returns doc ID for root container", () => {
    const id = generateEntityId(null, "container", "Hamlet", 0);
    expect(id).toMatch(/^doc_\d+$/);
  });

  it("returns slug for root non-container (no hyphens)", () => {
    expect(generateEntityId(null, "annotation", "My Note", 0)).toBe("mynote");
  });

  it("returns segmented counter for segment", () => {
    expect(generateEntityId("work-1", "segment", "Some text", 0)).toBe("work-1_seg-0001");
    expect(generateEntityId("work-1", "segment", "More", 12)).toBe("work-1_seg-0013");
  });

  it("returns parent slug for non-segment child", () => {
    expect(generateEntityId("work-1", "annotation", "Note", 0)).toBe("work-1_note");
  });

  it("uses type as fallback when content is empty", () => {
    expect(generateEntityId("parent-1", "concept", undefined, 0)).toBe("parent-1_concept");
  });

  it("keeps parent _seg-N in id for non-segment child (prefix strip happens after append)", () => {
    const id = generateEntityId("doc-1_seg-0001", "annotation", "Tag", 0);
    expect(id).toBe("doc-1_seg-0001_tag");
  });
});

describe("generateUniqueId", () => {
  it("returns base id when no collision", () => {
    expect(generateUniqueId("p", "annotation", "Note", new Set(["other"]), 0)).toBe("p_note");
  });

  it("appends -N counter on collision", () => {
    expect(generateUniqueId("p", "annotation", "Note", new Set(["p_note"]), 0)).toBe("p_note-1");
  });

  it("increments counter for multiple collisions", () => {
    expect(generateUniqueId("p", "annotation", "Note", new Set(["p_note", "p_note-1", "p_note-2"]), 0)).toBe("p_note-3");
  });
});
