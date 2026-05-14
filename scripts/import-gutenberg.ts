import { readFileSync, writeFileSync } from "fs";
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
  // Character names: all-caps words, optionally joined by "and" (e.g. "ROSENCRANTZ AND GUILDENSTERN")
  // This rejects prose like "Give him the cup."
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

function html(): void {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: npx tsx scripts/import-gutenberg.ts <path-to-html>");
    process.exit(1);
  }

  const html = readFileSync(filePath, "utf-8");
  const doc = parse(html);

  // Find all chapter divs that contain act headings
  const chapters = doc.querySelectorAll("div.chapter");

  let currentActId: string | null = null;
  let currentSceneId: string | null = null;
  let lastSegmentId: string | null = null;

  for (const chapter of chapters) {
    const h2 = chapter.querySelector("h2");
    if (!h2) continue;

    const h2Text = h2.text.trim();
    if (!h2Text.startsWith("ACT") && !h2Text.includes("ACT")) continue;

    // This is an act chapter
    const actMatch = h2Text.match(/ACT\s+([A-Z]+)/i);
    const actTitle = actMatch ? `Act ${actMatch[1]}` : h2Text;
    currentActId = addEntity({
      id: nextId("act"),
      kind: "container",
      title: actTitle,
      metadata: { type: "act", source: "hamlet" },
    });

    // Process children of this chapter
    const children = chapter.childNodes;
    for (const child of children) {
      if (child.nodeType !== 1) continue;
      const el = child as HTMLElement;
      const tag = el.tagName.toLowerCase();

      if (tag === "h3") {
        // Scene heading
        const sceneText = cleanText(el.text);
        if (!sceneText.startsWith("SCENE")) continue;

        const locationMatch = sceneText.match(/SCENE\s+[A-Z]+\.\s*(.*)/i);
        const sceneTitleParts = locationMatch
          ? [sceneText, locationMatch[1]]
          : [sceneText, ""];

        currentSceneId = addEntity({
          id: nextId("scene"),
          kind: "container",
          title: sceneTitleParts[0],
          content: sceneTitleParts[1] || undefined,
          metadata: { type: "scene", source: "hamlet" },
        });

        if (currentActId) {
          addRelation({
            id: nextId("rel"),
            source: currentActId,
            target: currentSceneId,
            type: "contains",
            metadata: {},
          });
        }
        lastSegmentId = null;
      }

      if (tag === "p") {
        const cls = el.getAttribute("class") ?? "";

        if (cls === "scenedesc") {
          // Stage direction (entrance, exit, etc.)
          const text = cleanText(el.text);
          if (isBlank(text)) continue;

          const segId = addEntity({
            id: nextId("seg"),
            kind: "segment",
            content: text
              .replace(/^Enter\s+/i, "")
              .replace(/^Re-enter\s+/i, "Enter "),
            metadata: { type: "stage-direction", source: "hamlet" },
          });

          if (currentSceneId) {
            addRelation({
              id: nextId("rel"),
              source: currentSceneId,
              target: segId,
              type: "contains",
              metadata: {},
            });
          }
          if (lastSegmentId) {
            addRelation({
              id: nextId("rel"),
              source: lastSegmentId,
              target: segId,
              type: "next",
              metadata: {},
            });
          }
          lastSegmentId = segId;
        } else if (cls === "drama") {
          // Character speech
          const html = el.innerHTML;
          const parts = html.split(/<br\s*\/?>/i).map((s) =>
            cleanText(s.replace(/<[^>]+>/g, ""))
          ).filter((s) => !isBlank(s));

          if (parts.length === 0) continue;

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

          if (isBlank(dialogue)) continue;

          if (character && dialogue) {
            // New speech with character attribution
            const segId = addEntity({
              id: nextId("seg"),
              kind: "segment",
              title: character,
              content: dialogue,
              metadata: { character, source: "hamlet" },
            });

            if (currentSceneId) {
              addRelation({
                id: nextId("rel"),
                source: currentSceneId,
                target: segId,
                type: "contains",
                metadata: {},
              });
            }
            if (lastSegmentId) {
              addRelation({
                id: nextId("rel"),
                source: lastSegmentId,
                target: segId,
                type: "next",
                metadata: {},
              });
            }
            lastSegmentId = segId;
          } else if (lastSegmentId) {
            // Continuation — merge into last segment
            const last = entities.find((e) => e.id === lastSegmentId);
            if (last && last.content) {
              last.content += "\n\n" + dialogue;
            }
          }
        } else if (cls === "right") {
          // Exit / action notes (e.g., [Exit.])
          const text = cleanText(el.text);
          if (isBlank(text)) continue;

          const segId = addEntity({
            id: nextId("seg"),
            kind: "segment",
            content: text,
            metadata: { type: "stage-direction", source: "hamlet" },
          });

          if (currentSceneId) {
            addRelation({
              id: nextId("rel"),
              source: currentSceneId,
              target: segId,
              type: "contains",
              metadata: {},
            });
          }
          if (lastSegmentId) {
            addRelation({
              id: nextId("rel"),
              source: lastSegmentId,
              target: segId,
              type: "next",
              metadata: {},
            });
          }
          lastSegmentId = segId;
        }
      }
    }
  }

  const output = {
    version: 1,
    entities,
    relations,
  };

  console.log(JSON.stringify(output, null, 2));
  console.error(`Generated ${entities.length} entities and ${relations.length} relations.`);
}

html();
