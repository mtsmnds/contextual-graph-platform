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

export function generateDocId(): string {
  return `doc_${Date.now()}`;
}

const SEG_PREFIX_RE = /_seg-\d+$/;

export function generateEntityId(
  parentId: string | null,
  kind: string,
  content: string | undefined,
  siblingCount: number,
): string {
  if (!parentId) {
    if (kind === "container") return generateDocId();
    return content ? slugify(content) : kind;
  }

  if (kind === "segment") {
    const counter = String(siblingCount + 1).padStart(4, "0");
    return `${parentId}_seg-${counter}`;
  }

  const slug = content ? slugify(content) : kind;
  let base = `${parentId}_${slug}`;

  base = base.replace(SEG_PREFIX_RE, "");

  return base;
}

export function generateUniqueId(
  parentId: string | null,
  kind: string,
  content: string | undefined,
  existingIds: Set<string>,
  siblingCount: number,
): string {
  const base = generateEntityId(parentId, kind, content, siblingCount);
  if (!existingIds.has(base)) return base;

  let counter = 1;
  while (existingIds.has(`${base}-${counter}`)) counter++;
  return `${base}-${counter}`;
}
