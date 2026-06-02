# m5-prd0059: Entity Form (Create Mode)

## Overview

A route-agnostic, composable form for creating entities and their relations. Built as a kit of section components that can be assembled into a full creation form or used independently (e.g., adding a relation from a node inspector).

The form is a platform — it evolves as entity types, metadata fields, and relation types are added. Section-level composability lets new fields and experiences be added without rewriting the form.

First UI consumer of sort order store actions from PRD 0057.

## Specification / Acceptance Criteria

### 1. Section components

Each form section is an independent component. The full `EntityForm` composes them, but each can be mounted standalone.

|Component|Purpose|
|---------|-------|
|`EntityTypeField`|Combobox — select existing `EntityType` or type a new one to create it|
|`ContentField`|Textarea for entity content|
|`RelationEditor`|Single relation row: relation type (combobox) + target node (combobox) + position picker (if `contains`)|
|`RelationsSection`|Manages a list of `RelationEditor` rows with "add another"|
|`MetadataFields`|Conditional fields based on entity type. Segment: `lineNumber` (number), `character` (text). Other types: empty for now.|
|`EntityForm`|Composes all sections above. Full creation form.|

### 2. EntityForm props

```
onSubmit?: (entityId: string) => void
defaultParentId?: string    // pre-selects a contains relation to this container
```

### 3. Entity type — combobox

Renders existing `EntityType` values as options. Typing filters the list. If no match, the typed value becomes a new entity type. Uses shadcn Combobox.

### 4. Relations section

Each row has:
- **Relation type** — combobox (select existing types from the graph, or type a new one)
- **Target node** — combobox (select from existing entities, filterable)
- **Position picker** — only visible when relation type is `contains`. Shows "Place after: [sibling list / (beginning)]" using `getContainerChildren`. When `contains` is selected, semantics are inverted: the target node is the parent container, the new entity is the child.

User can add multiple relation rows. At least one `contains` relation triggers sort order integration.

If `defaultParentId` prop is provided, pre-populate one `contains` relation row.

### 5. Store integration on submit

1. `addEntity(type, { content, metadata })` — creates the entity. **No `parentId` parameter is passed** (the `parentId` field is deprecated from the official graph; parent-child relationships are expressed exclusively through `contains` edges).
2. For each relation:
   - If `contains` with position "end" → `appendChild(targetId, newEntityId)`
   - If `contains` with position "after X" → `insertChild(targetId, newEntityId, prevKey, nextKey)`
   - If non-contains → `addRelation(newEntityId, targetId, relationType)`
3. Calls `onSubmit(newEntityId)`.

### 6. Conditional metadata

Switch on entity type, render relevant fields. For `segment`: `lineNumber` (number input) and `character` (text input), both optional. Other types: nothing yet. New cases added as metadata conventions are defined.

### 7. Composable mounting — viz-test-1 trigger

Ship with an `EntityFormDialog` wrapper — dialog with trigger button. Mount the trigger in the viz-test-1 route (`src/routes/VizTest1.tsx`), alongside the existing header controls. This provides a test surface for the form while keeping it separate from the primary canvas.

The `RelationsSection` also works standalone with a `sourceId` prop for adding relations to an existing entity (future use in node inspectors — not wired up in this PRD, but the component supports it).

### 8. Tooling

- Use shadcn + baseui components. Use the shadcn MCP + skill.
- Create Storybook stories for `EntityForm` and for `RelationsSection` standalone.

### 9. No edit mode

Create only. Edit mode is a follow-up PRD.

## Files changed (inferred)

|File|Change|
|----|------|
|`src/components/entity-form/EntityForm.tsx`|New — full form composition|
|`src/components/entity-form/EntityTypeField.tsx`|New — entity type combobox|
|`src/components/entity-form/ContentField.tsx`|New — content textarea|
|`src/components/entity-form/RelationEditor.tsx`|New — single relation row|
|`src/components/entity-form/RelationsSection.tsx`|New — manages relation rows|
|`src/components/entity-form/MetadataFields.tsx`|New — conditional metadata|
|`src/components/entity-form/EntityFormDialog.tsx`|New — dialog wrapper|
|`src/routes/VizTest1.tsx`|Add EntityFormDialog trigger in header|
|`src/stories/EntityForm.stories.tsx`|New — storybook stories|
|`src/stories/RelationsSection.stories.tsx`|New — storybook stories|

## Phases

Single phase.

## Size advisory

Medium. Multiple section components, combobox patterns, sort order integration. The relation editor is the most complex piece — combobox for type, combobox for target, conditional position picker. Storybook stories add testing surface.
