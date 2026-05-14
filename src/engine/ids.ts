export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/['',.!?":;()\[\]{}—…–-]+/g, "")
    .replace(/[áàâãä]/g, "a")
    .replace(/[éèêë]/g, "e")
    .replace(/[íìîï]/g, "i")
    .replace(/[óòôõö]/g, "o")
    .replace(/[úùûü]/g, "u")
    .replace(/ç/g, "c")
    .replace(/ñ/g, "n")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    || "untitled";
}

const SEG_PREFIX_RE = /_seg-\d+$/;

export function generateEntityId(
  parentId: string | null,
  kind: string,
  title: string | undefined,
  siblingCount: number,
): string {
  if (!parentId) {
    return title ? slugify(title) : kind;
  }

  if (kind === "segment") {
    const counter = String(siblingCount + 1).padStart(4, "0");
    return `${parentId}_seg-${counter}`;
  }

  const slug = title ? slugify(title) : kind;
  let base = `${parentId}_${slug}`;

  // If parent already uses _seg-N, strip it for cleaner container IDs
  base = base.replace(SEG_PREFIX_RE, "");

  return base;
}

export function generateUniqueId(
  parentId: string | null,
  kind: string,
  title: string | undefined,
  existingIds: Set<string>,
  siblingCount: number,
): string {
  const base = generateEntityId(parentId, kind, title, siblingCount);
  if (!existingIds.has(base)) return base;

  let counter = 1;
  while (existingIds.has(`${base}-${counter}`)) counter++;
  return `${base}-${counter}`;
}
