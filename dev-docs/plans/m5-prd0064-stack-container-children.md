# PRD 0064: Stack Container Children

## Overview ￼

A pure stacking function that positions a container’s direct children in a vertical column, ordered by `sortOrder` with a fixed gap. Triggered via right-click context menu on a container. Container auto-sizes to fit its children after stacking.

This is the innermost layout function in a bottom-up pipeline. Future layout steps will call `stackChildren` first on each container, then position containers relative to each other (Level 2), then resolve cross-container alignment constraints (Level 3).

## Feature Flag ￼

The “Stack Children” context menu item is gated by the existing `autoLayout` feature flag:

- `autoLayout: true` → enabled

- `autoLayout: false` → present but disabled (greyed out)

## Solution ￼

### `stackChildren` ￼

A pure function exported from `src/engine/layout.ts`. No store reads, no side effects.

```ts
type StackInput = {
  id: string
  width: number
  height: number
  sortOrder: string
}

type StackOutput = {
  children: { id: string; x: number; y: number }[]
  containerWidth: number
  containerHeight: number
}

function stackChildren(
  children: StackInput[],
  gap: number,
  padding: { top: number; right: number; bottom: number; left: number }
): StackOutput

```

Steps:

1. Sort children by `sortOrder` (lexicographic, fractional indexing).

2. `containerWidth` = widest child + `padding.left` + `padding.right`.

3. For each child, assign:

 ▫ `x = padding.left`

 ▫ `y = padding.top + (sum of preceding children heights + gaps)`

1. `containerHeight = padding.top + sum of all child heights + (n-1) * gap + padding.bottom`.

2. Return child positions + container dimensions.

No children → defensive return of `{ children: [], containerWidth: padding.left + padding.right, containerHeight: padding.top + padding.bottom }`. However, the handler bails before calling `stackChildren` when the container is empty (no-op per AC5).

### Context menu wiring ￼

In `GraphCanvas.tsx`, add to context menu for `containerGroup` nodes:

```
label: "Stack Children"
disabled: !featureFlags.autoLayout
action: calls stackChildren with the container's children, writes positions + container dims to store via batch

```

The handler:

1. Reads the container's direct children via `contains` relations. If the list is empty, bail — this is a no-op.

2. Maps each child to `{ id, width: canvasData.width, height: canvasData.height, sortOrder }`.

3. Calls `stackChildren(children, 16, { top: 32, right: 16, bottom: 16, left: 16 })`.

4. Writes results to store inside `beginBatch("Stack Children")` / `endBatch()`.

`padding.top: 32` accounts for the container header. The other three sides are 16px.

## Acceptance Criteria ￼

- AC1: Right-clicking a container shows “Stack Children” when the node is a `containerGroup`.

- AC2: The item is enabled when `autoLayout` is `true`, disabled when `false`.

- AC3: Clicking “Stack Children” positions children in a vertical column ordered by `sortOrder`, left-aligned at `padding.left`, with `16px` gap between each.

- AC4: Container resizes: width = widest child + 32px (16 left + 16 right), height = 32px header + sum of child heights + gaps + 16px bottom.

- AC5: Empty container is a no-op — the handler bails early without calling `stackChildren` or updating the store.

- AC6: Single child positions at `(padding.left, padding.top)`.

- AC7: Undo restores all child positions and container dimensions.

- AC8: `CanvasData.height` is required (`number`, not `number | undefined`). The type change is part of this PRD — all entities on the canvas have a height. `stackChildren` trusts the type. A defensive console.warn skip remains in `stackChildren` in case corrupted data reaches it at runtime.

## Files Changed ￼


|File                        |Change                                                                            |

|----------------------------|----------------------------------------------------------------------------------|

 |`src/types/graph.ts`        |Make `CanvasData.height` required (`number`, not `number \| undefined`)            |
 |`src/store/useGraphStore.ts`|Update `addEntity` fallback, `snapCanvasDim`, `applyMeasuredDimensions` for required `height`|
 |`src/engine/layout.ts`      |Add `stackChildren()` — pure function, no store coupling                          |
 |`src/canvas/GraphCanvas.tsx`|Add “Stack Children” context menu item for `containerGroup`, gated by `autoLayout`|
 |`src/engine/layout.test.ts` |New — unit tests for `stackChildren`                                              |

## Tests ￼

`src/engine/layout.test.ts` ￼



|Test                                             |What it verifies                                                                                 |

|-------------------------------------------------|-------------------------------------------------------------------------------------------------|

|`stacks children in sortOrder`                   |3 children with sortOrders “a0”, “a1”, “a2” → y positions form a descending column with 16px gaps|

|`computes container width from widest child`     |Widest child drives container width + left/right padding                                         |

|`computes container height from stacked children`|Sum of heights + gaps + top + bottom padding                                                     |

|`empty children returns empty positions`         |No children → returns padding-only container dims                                                |

|`single child at origin`                         |One child → positioned at `(padding.left, padding.top)`                                          |

|`skips child without height (defensive)`          |Child with `undefined` height → excluded with console.warn, other children unaffected            |

|`sorts by fractional index correctly`            |“a0”, “a2”, “a1” → sorted to “a0”, “a1”, “a2”                                                    |

## Dependencies ￼

- `CanvasData.height` is now required (`number`). All creation sites already set it. The `addEntity` fallback and `snapCanvasDim`/`applyMeasuredDimensions` are updated to match.

## Notes ￼

- `stackChildren` is designed for composability. It will be called by future layout functions: first on segment containers (chapters, scenes, acts), then on higher-level containers. The pure signature means the pipeline can call it per-container without side effects.

- `estimateNodeHeight` is not used. The type system guarantees `height` is always present; the defensive console.warn inside `stackChildren` is only for corrupted data.

- The 32px header padding is an estimate. If container headers become multi-line, this should be measured — but that’s a future concern.

- Dagre is not used at this level. It enters the picture at Level 3 (cross-container note alignment with collision resolution) in PRD 0065.

 