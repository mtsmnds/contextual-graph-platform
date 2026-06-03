import { readFileSync, writeFileSync, existsSync } from "fs";
import { generateKeyBetween } from "fractional-indexing-jittered";

type EntityType = "segment" | "container" | "annotation" | "concept" | "summary";

interface Entity {
  id: string;
  type: EntityType;
  parentId?: string;
  [key: string]: unknown;
}

interface Relation {
  id: string;
  source: string;
  target: string;
  type: string;
  sortOrder: string;
  metadata: Record<string, unknown>;
}

interface GraphData {
  version: number;
  entities: Entity[];
  relations: Relation[];
  [key: string]: unknown;
}

function main() {
  const path = process.argv[2];
  if (!path) {
    console.error("Usage: npx tsx scripts/migrate-remove-parentId.ts <path-to-graph.json>");
    process.exit(1);
  }
  if (!existsSync(path)) {
    console.error(`File not found: ${path}`);
    process.exit(1);
  }

  const raw = readFileSync(path, "utf-8");
  const data: GraphData = JSON.parse(raw);

  const { entities, relations } = data;

  const entityById = new Map<string, Entity>();
  for (const e of entities) {
    entityById.set(e.id, e);
  }

  // Track which entities have outgoing contains edges
  const outContains = new Set<string>();
  for (const r of relations) {
    if (r.type === "contains") {
      outContains.add(r.source);
    }
  }

  // Quick reference for existing contains edges keyed by target
  const containsByTarget = new Map<string, Relation>();
  for (const r of relations) {
    if (r.type === "contains") {
      containsByTarget.set(r.target, r);
    }
  }

  let parentIdCount = 0;
  let edgeCreatedCount = 0;
  let parentMissingWarn = 0;
  let promoteCount = 0;

  // Step C: Convert parentId → contains edges (before promotion, since this creates new parents)
  // Sequential keys per parent to avoid sort order collisions
  const perParentKey = new Map<string, string | null>();

  for (const entity of entities) {
    const pid = entity.parentId;
    if (pid === undefined || pid === null) continue;
    parentIdCount++;

    if (!entityById.has(pid)) {
      console.warn(`  [warn] parentId target "${pid}" not found (entity: "${entity.id}") — skipping edge creation`);
      parentMissingWarn++;
    } else if (containsByTarget.has(entity.id)) {
      // Edge already exists, just delete parentId
    } else {
      // Create missing contains edge
      const prevKey = perParentKey.get(pid) ?? null;
      const newKey = generateKeyBetween(prevKey, null);
      perParentKey.set(pid, newKey);

      const rel: Relation = {
        id: `r_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        source: pid,
        target: entity.id,
        type: "contains",
        sortOrder: newKey,
        metadata: {},
      };
      relations.push(rel);
      edgeCreatedCount++;
    }

    // Remove parentId from entity
    delete entity.parentId;
  }

  // Step A: Promote non-container parents to container
  // Recompute outContains since we may have added new contains edges
  outContains.clear();
  for (const r of relations) {
    if (r.type === "contains") {
      outContains.add(r.source);
    }
  }

  for (const entity of entities) {
    if (entity.type !== "container" && outContains.has(entity.id)) {
      console.log(`  promote: "${entity.id}" (${entity.type}) → container`);
      entity.type = "container";
      promoteCount++;
    }
  }

  // Step B: Belt-and-suspenders — strip any remaining parentId (catches anything missed)
  for (const entity of entities) {
    if ("parentId" in entity) {
      console.warn(`  [warn] leftover parentId on "${entity.id}" — removed`);
      delete entity.parentId;
    }
  }

  // Bump version to 6 to signal the migration ran (v6 = no parentId on entities)
  if (parentIdCount > 0 || promoteCount > 0 || edgeCreatedCount > 0) {
    data.version = 6;
  }

  writeFileSync(path, JSON.stringify(data, null, 2) + "\n");

  console.log(`\nDone: ${path}`);
  console.log(`  entities with parentId:    ${parentIdCount}`);
  console.log(`  contains edges created:    ${edgeCreatedCount}`);
  console.log(`  entities promoted:         ${promoteCount}`);
  if (parentMissingWarn > 0) {
    console.log(`  parentId target warnings:  ${parentMissingWarn}`);
  }
}

main();
