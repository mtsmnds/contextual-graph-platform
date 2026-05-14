import { readFileSync } from "fs";
import { parse, type HTMLElement } from "node-html-parser";

interface Entity {
  id: string;
  kind: "container" | "segment";
  title?: string;
  content?: string;
  metadata: Record<string, unknown>;
}

interface Relation {
  id: string;
  source: string;
  target: string;
  type: "contains" | "next" | "annotates";
  metadata: Record<string, unknown>;
}

const entities: Entity[] = [];
const relations: Relation[] = [];
let entityCounter = 0;

function nextId(prefix: string): string {
  return `${prefix}_${++entityCounter}`;
}

function addEntity(e: Entity) {
  entities.push(e);
  return e.id;
}

function addRelation(r: Relation) {
  relations.push(r);
  return r.id;
}

function cleanText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function isBlank(text: string): boolean {
  return text.replace(/\s/g, "").length === 0;
}

function extractCharName(text: string): [string, string] {
  const trimmed = text.trim();
  const match = trimmed.match(
    /^([A-Z][A-Z\s,&]*[A-Z](?:\s+and\s+[A-Z][A-Z\s,&]*[A-Z])?)\s*\.\s*(.*)/
  );
  if (match) {
    const name = match[1].trim().toUpperCase();
    const rest = match[2].trim();
    return [name, rest];
  }
  return ["", trimmed];
}

function getTextOf(el: HTMLElement): string {
  return cleanText(el.text);
}

function processDramaParagraph(
  el: HTMLElement,
  sceneId: string | null,
  lastId: string | null,
): string | null {
  const html = el.innerHTML;
  const parts = html.split(/<br\s*\/?>/i).map((s) =>
    cleanText(s.replace(/<[^>]+>/g, ""))
  ).filter((s) => !isBlank(s));
  if (parts.length === 0) return lastId;

  let character = "";
  let dialogueStart = 0;

  const [charName, firstLine] = extractCharName(parts[0]);
  if (charName) {
    character = charName.toUpperCase();
    dialogueStart = firstLine ? 1 : 0;
    parts[0] = firstLine || parts[0];
  }

  const dialogueParts = dialogueStart > 0 ? parts.slice(dialogueStart) : parts;
  const dialogue = dialogueParts.filter((p) => !isBlank(p)).join("\n");
  if (isBlank(dialogue)) return lastId;

  if (character && dialogue) {
    const segId = addEntity({
      id: nextId("seg"),
      kind: "segment",
      title: character,
      content: dialogue,
      metadata: { character, source: "hamlet" },
    });
    if (sceneId) addRelation({ id: nextId("rel"), source: sceneId, target: segId, type: "contains", metadata: {} });
    if (lastId) addRelation({ id: nextId("rel"), source: lastId, target: segId, type: "next", metadata: {} });
    return segId;
  }

  if (lastId) {
    const last = entities.find((e) => e.id === lastId);
    if (last && last.content) last.content += "\n\n" + dialogue;
  }
  return lastId;
}

function processStageDirection(
  text: string,
  parentId: string | null,
  lastId: string | null,
): string | null {
  const cleaned = cleanText(text);
  if (isBlank(cleaned)) return lastId;

  const segId = addEntity({
    id: nextId("seg"),
    kind: "segment",
    content: cleaned,
    metadata: { type: "stage-direction", source: "hamlet" },
  });
  if (parentId) addRelation({ id: nextId("rel"), source: parentId, target: segId, type: "contains", metadata: {} });
  if (lastId) addRelation({ id: nextId("rel"), source: lastId, target: segId, type: "next", metadata: {} });
  return segId;
}

function parseActChapter(
  chapter: HTMLElement,
  workId: string,
  lastSegmentId: string | null,
): string | null {
  const h2 = chapter.querySelector("h2");
  if (!h2) return lastSegmentId;

  const h2Text = getTextOf(h2);
  const actMatch = h2Text.match(/ACT\s+([A-Z]+)/i);
  if (!actMatch) return lastSegmentId;

  const actTitle = `Act ${actMatch[1]}`;
  const actId = addEntity({
    id: nextId("act"),
    kind: "container",
    title: actTitle,
    metadata: { type: "act", source: "hamlet" },
  });
  addRelation({ id: nextId("rel"), source: workId, target: actId, type: "contains", metadata: {} });

  if (lastSegmentId) {
    addRelation({ id: nextId("rel"), source: lastSegmentId, target: actId, type: "next", metadata: {} });
  }
  let lastId: string | null = null;
  let currentSceneId: string | null = null;

  const children = chapter.childNodes;
  for (const child of children) {
    if (child.nodeType !== 1) continue;
    const el = child as HTMLElement;
    const tag = el.tagName.toLowerCase();

    if (tag === "h2") continue;

    if (tag === "h3") {
      const sceneText = getTextOf(el);
      if (!sceneText.startsWith("SCENE")) continue;

      const locationMatch = sceneText.match(/SCENE\s+[A-Z]+\.\s*(.*)/i);
      currentSceneId = addEntity({
        id: nextId("scene"),
        kind: "container",
        title: sceneText,
        content: locationMatch ? locationMatch[1] || undefined : undefined,
        metadata: { type: "scene", source: "hamlet" },
      });
      addRelation({ id: nextId("rel"), source: actId, target: currentSceneId, type: "contains", metadata: {} });

      if (lastId) {
        addRelation({ id: nextId("rel"), source: lastId, target: currentSceneId, type: "next", metadata: {} });
      }
      lastId = null;
      continue;
    }

    if (tag === "p") {
      const cls = el.getAttribute("class") ?? "";
      if (cls === "scenedesc") {
        lastId = processStageDirection(getTextOf(el), currentSceneId, lastId);
      } else if (cls === "drama") {
        lastId = processDramaParagraph(el, currentSceneId, lastId);
      } else if (cls === "right") {
        lastId = processStageDirection(getTextOf(el), currentSceneId, lastId);
      }
    }
  }

  return actId;
}

function html(): void {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: npx tsx scripts/import-gutenberg.ts <path-to-html>");
    process.exit(1);
  }

  const raw = readFileSync(filePath, "utf-8");
  const doc = parse(raw);

  // --- Extract title and author ---
  const titleEl = doc.querySelector("h1");
  const authorEl = doc.querySelector("h2.no-break");
  const workTitle = titleEl ? getTextOf(titleEl as HTMLElement) : "Hamlet";
  const authorText = authorEl ? getTextOf(authorEl as HTMLElement) : "";

  // --- Create work entity (label only — no content on containers) ---
  const workId = addEntity({
    id: `hamlet--william-shakespeare`,
    kind: "container",
    title: workTitle,
    metadata: { type: "work", author: "William Shakespeare" },
  });

  // --- Title page as first child segment ---
  const titlePageId = addEntity({
    id: nextId("seg"),
    kind: "segment",
    title: workTitle,
    content: authorText || undefined,
    metadata: { type: "title-page", source: "hamlet" },
  });
  addRelation({ id: nextId("rel"), source: workId, target: titlePageId, type: "contains", metadata: {} });
  let lastSegmentId: string | null = titlePageId;

  // --- Find content boundaries ---
  const body = doc.querySelector("body")!;
  const allChildren = body.childNodes.filter((n) => n.nodeType === 1) as HTMLElement[];

  let pgHeaderEl: HTMLElement | null = null;
  let pgFooterEl: HTMLElement | null = null;
  let startIdx = 0;
  let endIdx = allChildren.length;

  for (let i = 0; i < allChildren.length; i++) {
    const el = allChildren[i];
    if (el.tagName.toLowerCase() === "section" && el.getAttribute("id") === "pg-header") {
      pgHeaderEl = el;
      startIdx = i + 1;
    }
    if (el.tagName.toLowerCase() === "section" && el.getAttribute("id") === "pg-footer") {
      pgFooterEl = el;
      endIdx = i;
    }
  }

  // --- PG header boilerplate ---
  if (pgHeaderEl) {
    // Remove the heading element, keep the rest
    const headingEl = pgHeaderEl.querySelector("h2");
    const headerDivs = pgHeaderEl.querySelectorAll("div");
    const parts: string[] = [];
    for (const div of headerDivs) {
      const text = cleanText(div.text);
      if (text && text.length > 5) parts.push(text);
    }
    if (parts.length > 0) {
      const headerId = addEntity({
        id: nextId("seg"),
        kind: "segment",
        title: "About the eBook",
        content: parts.join("\n\n"),
        metadata: { type: "front-matter", source: "hamlet" },
      });
      addRelation({ id: nextId("rel"), source: workId, target: headerId, type: "contains", metadata: {} });
      lastSegmentId = headerId;
    }
  }

  for (let i = startIdx; i < endIdx; i++) {
    const el = allChildren[i];
    const tag = el.tagName.toLowerCase();
    const cls = el.getAttribute("class") ?? "";
    const elId = el.getAttribute("id") ?? "";

    if (tag === "hr" || tag === "h1") continue;

    if (tag === "h2" && cls === "no-break") continue; // author line

    if (tag === "div" && cls === "chapter") {
      const h2 = el.querySelector("h2");
      if (h2) {
        const h2Text = getTextOf(h2);

        // Dramatis Personae (chapter with Contents heading)
        if (h2Text === "Contents") {
          // Get the Dramatis Personæ section and the scene line
          const dramaSection = el.querySelector("h3");
          const dramaTitle = dramaSection ? getTextOf(dramaSection as HTMLElement) : "Dramatis Personæ";
          const dramaPara = el.querySelector("p.drama");
          const sceneLine = el.querySelectorAll("h3");

          const dpContent: string[] = [];
          if (dramaPara) {
            const lines = dramaPara.text.split("\n").map(s => cleanText(s)).filter(s => s);
            dpContent.push(...lines);
          }

          const dpId = addEntity({
            id: nextId("dramatis"),
            kind: "container",
            title: dramaTitle,
            content: dpContent.join("\n") || undefined,
            metadata: { type: "dramatis-personae", source: "hamlet" },
          });
          addRelation({ id: nextId("rel"), source: workId, target: dpId, type: "contains", metadata: {} });
          if (lastSegmentId) addRelation({ id: nextId("rel"), source: lastSegmentId, target: dpId, type: "next", metadata: {} });
          lastSegmentId = dpId;

          // Get the "SCENE. Elsinore." line after dramatis personae
          if (sceneLine.length >= 2) {
            const sceneDesc = getTextOf(sceneLine[sceneLine.length - 1] as HTMLElement);
            if (sceneDesc && sceneDesc !== dramaTitle && sceneDesc.startsWith("SCENE")) {
              const segId = addEntity({
                id: nextId("seg"),
                kind: "segment",
                content: sceneDesc,
                metadata: { type: "stage-direction", source: "hamlet" },
              });
              addRelation({ id: nextId("rel"), source: workId, target: segId, type: "contains", metadata: {} });
              if (lastSegmentId) addRelation({ id: nextId("rel"), source: lastSegmentId, target: segId, type: "next", metadata: {} });
              lastSegmentId = segId;
            }
          }
          continue;
        }

        // Act chapter
        if (h2Text.startsWith("ACT") || h2Text.includes("ACT")) {
          lastSegmentId = parseActChapter(el, workId, lastSegmentId);
          continue;
        }
      }

      // Other chapter div content
      const chapterText = cleanText(el.text);
      if (!isBlank(chapterText) && chapterText.length > 20) {
        const segId = addEntity({
          id: nextId("seg"),
          kind: "segment",
          content: chapterText,
          metadata: { source: "hamlet" },
        });
        addRelation({ id: nextId("rel"), source: workId, target: segId, type: "contains", metadata: {} });
        if (lastSegmentId) addRelation({ id: nextId("rel"), source: lastSegmentId, target: segId, type: "next", metadata: {} });
        lastSegmentId = segId;
      }
    }

    // Transcriber's Notes div
    if (tag === "div" && el.getAttribute("style")?.includes("margin-top: 5%")) {
      const notesText = cleanText(el.text);
      if (!isBlank(notesText) && notesText.length > 20) {
        const segId = addEntity({
          id: nextId("seg"),
          kind: "segment",
          title: "Transcriber's Notes",
          content: notesText,
          metadata: { type: "end-matter", source: "hamlet" },
        });
        addRelation({ id: nextId("rel"), source: workId, target: segId, type: "contains", metadata: {} });
        if (lastSegmentId) addRelation({ id: nextId("rel"), source: lastSegmentId, target: segId, type: "next", metadata: {} });
        lastSegmentId = segId;
      }
    }
  }

  // --- PG footer boilerplate ---
  if (pgFooterEl) {
    const footerDivs = pgFooterEl.querySelectorAll("div");
    const parts: string[] = [];
    for (const div of footerDivs) {
      const text = cleanText(div.text);
      if (text && text.length > 5) parts.push(text);
    }
    if (parts.length > 0) {
      const footerId = addEntity({
        id: nextId("seg"),
        kind: "segment",
        title: "License",
        content: parts.join("\n\n"),
        metadata: { type: "end-matter", source: "hamlet" },
      });
      addRelation({ id: nextId("rel"), source: workId, target: footerId, type: "contains", metadata: {} });
      if (lastSegmentId) addRelation({ id: nextId("rel"), source: lastSegmentId, target: footerId, type: "next", metadata: {} });
    }
  }

  const output = { version: 1, entities, relations };
  console.log(JSON.stringify(output, null, 2));
  console.error(`Generated ${entities.length} entities and ${relations.length} relations.`);
}

html();
