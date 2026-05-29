import { useEffect, useRef, useState, useCallback } from "react"
import { useGraphStore } from "../store/useGraphStore"
import type { Entity, Relation } from "../types/graph"
import * as d3 from "d3"

const TYPE_COLORS: Record<string, string> = {
  container: "#C45D3E",
  concept: "#6B8A3B",
  summary: "#8B5CF6",
  segment: "#B8964C",
  annotation: "#5B9A9A",
}

const RELATION_COLORS: Record<string, string> = {
  contains: "#BBB",
  related_to: "#999",
}

function nodeRadius(type: string): number {
  switch (type) {
    case "container": return 14
    case "summary": return 10
    case "concept": return 8
    default: return 6
  }
}

function nodeColor(type: string): string {
  return TYPE_COLORS[type] ?? "#999"
}

function relColor(type: string): string {
  return RELATION_COLORS[type] ?? "#AAA"
}

function clamp(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + "\u2026" : s
}

function selectNodeInGraph(
  svgEl: SVGSVGElement | null,
  nodeId: string,
  relations: Relation[],
) {
  if (!svgEl) return
  const connectedIds = new Set<string>()
  connectedIds.add(nodeId)
  for (const r of relations) {
    if (r.source === nodeId) connectedIds.add(r.target)
    if (r.target === nodeId) connectedIds.add(r.source)
  }

  d3.select(svgEl)
    .selectAll<SVGGElement, any>(".viz-group")
    .classed("selected", (d) => d.id === nodeId)
    .classed("dimmed", (d) => !connectedIds.has(d.id))

  d3.select(svgEl)
    .selectAll<SVGLineElement, any>(".viz-link")
    .transition()
    .duration(200)
    .attr("stroke-opacity", (d) => {
      const sid =
        typeof d.source === "object" ? d.source.id : d.source
      const tid =
        typeof d.target === "object" ? d.target.id : d.target
      return sid === nodeId || tid === nodeId ? 1 : 0.06
    })
    .attr("stroke-width", (d) => {
      const sid =
        typeof d.source === "object" ? d.source.id : d.source
      const tid =
        typeof d.target === "object" ? d.target.id : d.target
      if (sid === nodeId || tid === nodeId) return 2
      return d.type === "contains" ? 1 : 1.5
    })
}

function isValidGraphData(json: unknown): json is { entities: unknown[]; relations: unknown[] } {
  return (
    typeof json === "object" &&
    json !== null &&
    "entities" in json &&
    Array.isArray((json as Record<string, unknown>).entities) &&
    "relations" in json &&
    Array.isArray((json as Record<string, unknown>).relations)
  )
}

export default function VizTest1() {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const nodeSelRef = useRef<
    d3.Selection<SVGGElement, Entity & d3.SimulationNodeDatum, null, unknown> | null
  >(null)
  const linkSelRef = useRef<
    d3.Selection<SVGLineElement, Relation, null, unknown> | null
  >(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"graph" | "json">("graph")
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    container: true,
    concept: true,
    summary: true,
    segment: true,
    annotation: true,
  })
  const [rebuildKey, setRebuildKey] = useState(0)
  const [graphData, setGraphData] = useState<{
    entities: Entity[]
    relations: Relation[]
  } | null>(null)
  const [dropState, setDropState] = useState<"idle" | "dragover" | "error">("idle")
  const [parseError, setParseError] = useState<string | null>(null)

  const hydrated = useGraphStore((s) => s.hydrated)

  useEffect(() => {
    if (hydrated && !graphData) {
      const { entities, relations } = useGraphStore.getState()
      setGraphData({ entities, relations })
    }
  }, [hydrated, graphData])

  const loadFromFile = useCallback((file: File) => {
    setDropState("idle")
    setParseError(null)
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result as string)
        if (!isValidGraphData(json)) {
          setDropState("error")
          setParseError('Invalid format — expected { "entities": [...], "relations": [...] }')
          return
        }
        setGraphData({
          entities: json.entities as Entity[],
          relations: json.relations as Relation[],
        })
      } catch {
        setDropState("error")
        setParseError("Could not parse file as JSON")
      }
    }
    reader.readAsText(file)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDropState("idle")
      const file = e.dataTransfer.files[0]
      if (file) loadFromFile(file)
    },
    [loadFromFile],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDropState("dragover")
  }, [])

  const handleDragLeave = useCallback(() => {
    setDropState("idle")
  }, [])

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) loadFromFile(file)
    },
    [loadFromFile],
  )

  const allEntities = graphData?.entities ?? []
  const allRelations = graphData?.relations ?? []

  const visibleEntities = allEntities.filter((e) => toggles[e.type] !== false)
  const visibleIds = new Set(visibleEntities.map((e) => e.id))
  const visibleRelations = allRelations.filter(
    (r) => visibleIds.has(r.source) && visibleIds.has(r.target),
  )

  const entityMap = new Map<string, Entity>()
  for (const e of allEntities) {
    entityMap.set(e.id, e)
  }

  const selectedEntity = selectedId
    ? (entityMap.get(selectedId) ?? null)
    : null

  const outgoingRelations = selectedId
    ? allRelations.filter((r) => r.source === selectedId)
    : []
  const incomingRelations = selectedId
    ? allRelations.filter((r) => r.target === selectedId)
    : []

  const toggleType = (type: string) => {
    setToggles((prev) => ({ ...prev, [type]: !prev[type] }))
    setSelectedId(null)
    setRebuildKey((k) => k + 1)
  }

  useEffect(() => {
    if (!graphData || viewMode !== "graph") return
    if (visibleEntities.length === 0) return

    const container = containerRef.current
    const svgEl = svgRef.current
    if (!container || !svgEl) return

    const w = container.clientWidth
    const h = container.clientHeight

    const svg = d3.select(svgEl)
    svg.on(".zoom", null)
    svg.html("")

    const g = svg.append("g")

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 5])
      .on("zoom", (event) => {
        g.attr("transform", event.transform)
      })
    svg.call(zoom)

    const nodes: (Entity & d3.SimulationNodeDatum)[] = visibleEntities.map(
      (e) => ({ ...e }),
    )
    const links = visibleRelations.map((r) => ({ ...r }))

    const linkSel = g
      .append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("class", "viz-link")
      .attr("stroke", (d) => relColor(d.type))
      .attr("stroke-width", (d) => (d.type === "contains" ? 1 : 1.5))
      .attr("stroke-opacity", 0.4)
      .attr("stroke-dasharray", (d) =>
        d.type === "related_to" ? "4,3" : null,
      )
    linkSelRef.current = linkSel as any

    const linkLabelSel = g
      .append("g")
      .selectAll("text")
      .data(links.filter((l) => l.type !== "contains"))
      .join("text")
      .style("font-size", "8px")
      .style("font-family", "monospace")
      .style("fill", "#94a3b8")
      .style("pointer-events", "none")
      .text((d) => d.type)

    const nodeSel = g
      .append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("class", "viz-group")
      .call(
        d3
          .drag<SVGGElement, Entity & d3.SimulationNodeDatum>()
          .on("start", (event, d) => {
            if (!event.active) sim.alphaTarget(0.3).restart()
            d.fx = d.x
            d.fy = d.y
          })
          .on("drag", (event, d) => {
            d.fx = event.x
            d.fy = event.y
          })
          .on("end", (event) => {
            if (!event.active) sim.alphaTarget(0)
            event.subject.fx = null
            event.subject.fy = null
          }) as any,
      )
      .on("click", (event, d) => {
        event.stopPropagation()
        setSelectedId(d.id)
        selectNodeInGraph(svgEl, d.id, visibleRelations)
      })
      .on("mouseenter", function (_event, d) {
        const circle = d3.select(this).select<SVGCircleElement>("circle")
        circle
          .transition()
          .duration(150)
          .attr("r", nodeRadius(d.type) + 3)
      })
      .on("mouseleave", function (_event, d) {
        const circle = d3.select(this).select<SVGCircleElement>("circle")
        circle
          .transition()
          .duration(150)
          .attr("r", nodeRadius(d.type))
      })
    nodeSelRef.current = nodeSel as any

    nodeSel
      .append("circle")
      .attr("class", "viz-node")
      .attr("r", (d) => nodeRadius(d.type))
      .attr("fill", (d) => nodeColor(d.type))
      .attr("stroke", (d) => {
        const c = d3.color(nodeColor(d.type))
        return c ? c.darker(0.4).toString() : "#666"
      })
      .attr("stroke-width", 2)

    nodeSel
      .append("text")
      .attr("dy", (d) => nodeRadius(d.type) + 12)
      .attr("text-anchor", "middle")
      .style("font-size", "9px")
      .style("font-family", "monospace")
      .style("fill", "#94a3b8")
      .style("pointer-events", "none")
      .text((d) => clamp(d.content || d.id, 20))

    svg.on("click", () => {
      setSelectedId(null)
      resetAll()
    })

    const sim = d3
      .forceSimulation<Entity & d3.SimulationNodeDatum>(nodes)
      .force(
        "link",
        d3
          .forceLink<Entity & d3.SimulationNodeDatum, Relation>(links)
          .id((d) => d.id)
          .distance(80),
      )
      .force(
        "charge",
        d3.forceManyBody<Entity & d3.SimulationNodeDatum>().strength(-250),
      )
      .force(
        "center",
        d3.forceCenter<Entity & d3.SimulationNodeDatum>(w / 2, h / 2),
      )
      .force(
        "collision",
        d3
          .forceCollide<Entity & d3.SimulationNodeDatum>()
          .radius((d) => nodeRadius(d.type) + 8),
      )

    sim.on("tick", () => {
      linkSel
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y)

      linkLabelSel
        .attr("x", (d: any) => (d.source.x + d.target.x) / 2)
        .attr("y", (d: any) => (d.source.y + d.target.y) / 2 - 4)

      nodeSel.attr("transform", (d: any) => `translate(${d.x},${d.y})`)
    })

    function resetAll() {
      if (!svgEl) return
      d3.select(svgEl)
        .selectAll<SVGGElement, any>(".viz-group")
        .classed("selected", false)
        .classed("dimmed", false)
      d3.select(svgEl)
        .selectAll<SVGLineElement, any>(".viz-link")
        .transition()
        .duration(200)
        .attr("stroke-opacity", 0.4)
        .attr("stroke-width", (d) => (d.type === "contains" ? 1 : 1.5))
    }

    return () => {
      sim.stop()
    }
  }, [graphData, viewMode, rebuildKey])

  const availableTypes = [
    ...new Set(allEntities.map((e) => e.type)),
  ].sort()
  const activeTypes = availableTypes.filter(
    (t) => toggles[t] !== false,
  ).length

  if (!graphData || allEntities.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div
          className={[
            "flex flex-col items-center justify-center gap-4 p-12 rounded-lg border-2 border-dashed transition-colors",
            dropState === "dragover"
              ? "border-primary bg-primary/5"
              : dropState === "error"
                ? "border-destructive bg-destructive/5"
                : "border-border hover:border-muted-foreground/30",
          ].join(" ")}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileInput}
          />
          <p className="text-sm text-muted-foreground">
            Drop <code className="text-[13px] bg-accent px-1 rounded">graph.json</code> here
          </p>
          <button
            className="text-sm text-muted-foreground underline hover:text-foreground cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            or click to browse
          </button>
          {parseError && (
            <p className="text-xs text-destructive">{parseError}</p>
          )}
          {hydrated && (
            <p className="text-xs text-muted-foreground mt-2">
              Workspace loaded but has no entities.
            </p>
          )}
        </div>
      </div>
    )
  }

  const toggleBtnClass = (type: string) =>
    [
      "px-2.5 py-1 text-[11px] font-mono border cursor-pointer transition-colors",
      availableTypes.length === 1 ? "rounded" : "",
      type === availableTypes[0] ? "rounded-l" : "",
      type === availableTypes[availableTypes.length - 1] ? "rounded-r" : "",
    ].join(" ")

  const toggleBtnActive = "bg-foreground text-background border-foreground"
  const toggleBtnInactive =
    "bg-transparent text-muted-foreground border-border hover:bg-accent"

  return (
    <>
      <style>{`
        .viz-group { cursor: pointer; }
        .viz-node { transition: opacity 0.2s, r 0.15s, stroke-width 0.2s, stroke 0.2s; }
        .viz-group.selected .viz-node { stroke-width: 3; stroke: #C45D3E; }
        .viz-group.dimmed { opacity: 0.12; pointer-events: none; }
        .viz-link { transition: stroke-opacity 0.2s, stroke-width 0.2s; }
      `}</style>
      <div className="grid grid-cols-[1fr_340px] grid-rows-[48px_1fr] h-full">
        <header className="col-span-2 flex items-center justify-between px-4 border-b border-border bg-card gap-3">
          <h1 className="text-sm font-semibold whitespace-nowrap">
            Graph Viz — Test 1
          </h1>

          <div className="flex items-center gap-3">
            {availableTypes.length > 0 && (
              <div className="flex gap-px">
                {availableTypes.map((type) => (
                  <button
                    key={type}
                    className={`${toggleBtnClass(type)} ${toggles[type] ? toggleBtnActive : toggleBtnInactive}`}
                    onClick={() => toggleType(type)}
                  >
                    {type}
                  </button>
                ))}
              </div>
            )}

            <div className="flex">
              <button
                className={`px-2.5 py-1 text-[11px] font-mono border border-border cursor-pointer rounded-l transition-colors ${
                  viewMode === "graph"
                    ? "bg-foreground text-background border-foreground"
                    : "bg-transparent text-muted-foreground hover:bg-accent"
                }`}
                onClick={() => setViewMode("graph")}
              >
                Graph
              </button>
              <button
                className={`px-2.5 py-1 text-[11px] font-mono border border-border cursor-pointer rounded-r transition-colors ${
                  viewMode === "json"
                    ? "bg-foreground text-background border-foreground"
                    : "bg-transparent text-muted-foreground hover:bg-accent"
                }`}
                onClick={() => setViewMode("json")}
              >
                JSON
              </button>
            </div>

            <span className="text-[11px] text-muted-foreground font-mono whitespace-nowrap">
              {visibleEntities.length} nodes · {visibleRelations.length} edges
              {activeTypes < availableTypes.length
                ? ` · ${activeTypes}/${availableTypes.length} types`
                : ""}
            </span>
          </div>
        </header>

        <div
          ref={containerRef}
          className="relative overflow-hidden bg-background"
        >
          {viewMode === "graph" ? (
            <svg ref={svgRef} className="w-full h-full" />
          ) : (
            <pre className="p-4 text-xs font-mono overflow-auto h-full whitespace-pre text-muted-foreground">
              {JSON.stringify(graphData, null, 2)}
            </pre>
          )}
        </div>

        <div className="border-l border-border bg-card overflow-hidden flex flex-col">
          <div className="overflow-y-auto flex-1 min-h-0">
            {selectedEntity ? (
              <>
                <div className="p-4 border-b border-border">
                  <div className="text-base font-semibold leading-tight">
                    {selectedEntity.content || selectedEntity.id}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono mt-1.5 break-all">
                    {selectedEntity.id}
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    <span
                      className="inline-block text-[9px] uppercase tracking-wider font-semibold font-mono px-2 py-0.5 rounded-sm"
                      style={{
                        background: `${nodeColor(selectedEntity.type)}20`,
                        color: nodeColor(selectedEntity.type),
                      }}
                    >
                      {selectedEntity.type}
                    </span>
                    {selectedEntity.parentId && (
                      <span className="inline-block text-[9px] uppercase tracking-wider font-semibold font-mono px-2 py-0.5 rounded-sm bg-accent text-muted-foreground">
                        child
                      </span>
                    )}
                  </div>
                </div>

                {selectedEntity.content && (
                  <div className="p-4 border-b border-border">
                    <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                      Content
                    </h3>
                    <div className="text-xs p-2.5 bg-accent/30 border-l-2 border-primary rounded-r">
                      {selectedEntity.content}
                    </div>
                  </div>
                )}

                {Object.keys(selectedEntity.metadata).length > 0 && (
                  <div className="p-4 border-b border-border">
                    <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                      Metadata
                    </h3>
                    <table className="w-full text-xs">
                      <tbody>
                        {Object.entries(selectedEntity.metadata).map(
                          ([key, value]) => (
                            <tr key={key}>
                              <td className="text-[10px] text-muted-foreground font-mono w-[80px] py-0.5 align-top pr-2">
                                {key}
                              </td>
                              <td className="py-0.5 break-all">
                                {typeof value === "object"
                                  ? JSON.stringify(value)
                                  : String(value)}
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {outgoingRelations.length > 0 && (
                  <div className="p-4 border-b border-border">
                    <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                      Outgoing ({outgoingRelations.length})
                    </h3>
                    <ul className="list-none space-y-1">
                      {outgoingRelations.map((r) => {
                        const target = entityMap.get(r.target)
                        return (
                          <li
                            key={r.id}
                            className="flex items-start gap-1.5 text-xs cursor-pointer hover:text-primary transition-colors"
                            onClick={() => {
                              setSelectedId(r.target)
                              selectNodeInGraph(svgRef.current, r.target, visibleRelations)
                            }}
                          >
                            <span className="text-muted-foreground shrink-0 mt-px">
                              &rarr;
                            </span>
                            <span className="text-[9px] font-mono px-1 py-px rounded-sm bg-accent text-muted-foreground shrink-0 mt-px">
                              {r.type}
                            </span>
                            <span className="break-all">
                              {target?.content || r.target}
                            </span>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}

                {incomingRelations.length > 0 && (
                  <div className="p-4 border-b border-border">
                    <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                      Incoming ({incomingRelations.length})
                    </h3>
                    <ul className="list-none space-y-1">
                      {incomingRelations.map((r) => {
                        const source = entityMap.get(r.source)
                        return (
                          <li
                            key={r.id}
                            className="flex items-start gap-1.5 text-xs cursor-pointer hover:text-primary transition-colors"
                            onClick={() => {
                              setSelectedId(r.source)
                              selectNodeInGraph(svgRef.current, r.source, visibleRelations)
                            }}
                          >
                            <span className="text-muted-foreground shrink-0 mt-px">
                              &larr;
                            </span>
                            <span className="text-[9px] font-mono px-1 py-px rounded-sm bg-accent text-muted-foreground shrink-0 mt-px">
                              {r.type}
                            </span>
                            <span className="break-all">
                              {source?.content || r.source}
                            </span>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground italic">
                Click a node to inspect
              </div>
            )}
          </div>

          {selectedEntity && (
            <div className="border-t border-border flex flex-col min-h-0" style={{ flex: "0 0 40%" }}>
              <div className="p-2.5 border-b border-border shrink-0">
                <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  JSON Inspector
                </h3>
              </div>
              <pre className="p-3 text-[10px] font-mono whitespace-pre text-muted-foreground leading-relaxed overflow-auto flex-1 min-h-0">
                {JSON.stringify(
                  {
                    entity: selectedEntity,
                    edges: [...outgoingRelations, ...incomingRelations],
                  },
                  null,
                  2,
                )}
              </pre>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
