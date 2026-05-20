import type { EntityKind, Entity, Relation } from "../types/graph"

interface EdgeMetadataConfig {
  relationType: string
  direction: "source" | "target"
  targetKind: EntityKind
}

const EDGE_METADATA_KEYS: Record<string, EdgeMetadataConfig> = {
  author: { relationType: "contains", direction: "target", targetKind: "container" },
}

export function getEdgeKeys(): string[] {
  return Object.keys(EDGE_METADATA_KEYS)
}

export function isEdgeKey(key: string): boolean {
  return key in EDGE_METADATA_KEYS
}

export function getEdgeConfig(key: string): EdgeMetadataConfig | undefined {
  return EDGE_METADATA_KEYS[key]
}

export type ResolveWriteContext = {
  entities: Entity[]
  relations: Relation[]
  addEntity: (kind: EntityKind, data?: Partial<Entity>) => string
  addRelation: (source: string, target: string, type: string) => string
}

export function resolveEdgeValue(
  entityId: string,
  key: string,
  ctx: { entities: Entity[]; relations: Relation[] },
): string | null {
  const config = EDGE_METADATA_KEYS[key]
  if (!config) return null

  for (const rel of ctx.relations) {
    if (rel.type !== config.relationType) continue

    let connectedId: string | null = null
    if (config.direction === "target") {
      if (rel.target === entityId) connectedId = rel.source
    } else {
      if (rel.source === entityId) connectedId = rel.target
    }

    if (connectedId) {
      const entity = ctx.entities.find((e) => e.id === connectedId)
      if (entity) return entity.content
    }
  }

  return null
}

export function findOrCreateEdgeBackedEntity(
  value: string,
  config: EdgeMetadataConfig,
  ctx: ResolveWriteContext,
): string {
  const existing = ctx.entities.find(
    (e) => e.kind === config.targetKind && e.content === value,
  )
  if (existing) return existing.id

  return ctx.addEntity(config.targetKind, { content: value })
}

export function writeEdgeValue(
  entityId: string,
  key: string,
  value: string,
  ctx: ResolveWriteContext,
): void {
  const config = EDGE_METADATA_KEYS[key]
  if (!config) return

  const connectedId = findOrCreateEdgeBackedEntity(value, config, ctx)

  for (const rel of ctx.relations) {
    if (rel.type !== config.relationType) continue

    if (config.direction === "target") {
      if (rel.target === entityId && rel.source === connectedId) return
    } else {
      if (rel.source === entityId && rel.target === connectedId) return
    }
  }

  if (config.direction === "target") {
    ctx.addRelation(connectedId, entityId, config.relationType)
  } else {
    ctx.addRelation(entityId, connectedId, config.relationType)
  }
}
