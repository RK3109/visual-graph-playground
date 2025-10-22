import { useEffect, useRef } from "react";
import { GraphData } from "@/types/graph";

interface GraphCanvasProps {
  graph: GraphData;
  highlightedNodes?: Set<number>;
  componentColors?: Map<number, number>;
  className?: string;
}

const COMPONENT_COLORS = [
  "hsl(187 100% 50%)", // cyan
  "hsl(280 80% 60%)",  // purple
  "hsl(330 85% 60%)",  // pink
  "hsl(30 100% 60%)",  // orange
  "hsl(150 70% 50%)",  // green
];

export function GraphCanvas({ graph, highlightedNodes, componentColors, className }: GraphCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Calculate node positions in a circular layout
    const nodes = Array.from(graph.adjacencyList.keys()).sort((a, b) => a - b);
    const nodePositions = new Map<number, { x: number; y: number }>();
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.35;

    nodes.forEach((node, index) => {
      const angle = (2 * Math.PI * index) / nodes.length - Math.PI / 2;
      nodePositions.set(node, {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      });
    });

    // Draw edges
    ctx.lineWidth = 2;
    for (const [from, neighbors] of graph.adjacencyList.entries()) {
      const fromPos = nodePositions.get(from);
      if (!fromPos) continue;

      for (const to of neighbors) {
        const toPos = nodePositions.get(to);
        if (!toPos) continue;

        // Get color based on component
        const componentColor = componentColors?.get(from);
        ctx.strokeStyle = componentColor !== undefined 
          ? COMPONENT_COLORS[componentColor % COMPONENT_COLORS.length]
          : "hsl(187 100% 50%)";
        
        ctx.beginPath();
        ctx.moveTo(fromPos.x, fromPos.y);
        ctx.lineTo(toPos.x, toPos.y);
        ctx.stroke();

        // Draw arrow for directed graphs
        if (graph.isDirected) {
          const angle = Math.atan2(toPos.y - fromPos.y, toPos.x - fromPos.x);
          const arrowLength = 15;
          const arrowAngle = Math.PI / 6;

          const endX = toPos.x - 25 * Math.cos(angle);
          const endY = toPos.y - 25 * Math.sin(angle);

          ctx.beginPath();
          ctx.moveTo(endX, endY);
          ctx.lineTo(
            endX - arrowLength * Math.cos(angle - arrowAngle),
            endY - arrowLength * Math.sin(angle - arrowAngle)
          );
          ctx.moveTo(endX, endY);
          ctx.lineTo(
            endX - arrowLength * Math.cos(angle + arrowAngle),
            endY - arrowLength * Math.sin(angle + arrowAngle)
          );
          ctx.stroke();
        }
      }
    }

    // Draw nodes
    nodes.forEach((node) => {
      const pos = nodePositions.get(node);
      if (!pos) return;

      const isHighlighted = highlightedNodes?.has(node);
      const componentColor = componentColors?.get(node);

      // Node circle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 25, 0, 2 * Math.PI);
      
      if (isHighlighted) {
        ctx.fillStyle = componentColor !== undefined
          ? COMPONENT_COLORS[componentColor % COMPONENT_COLORS.length]
          : "hsl(187 100% 50%)";
      } else {
        ctx.fillStyle = "hsl(0 0% 100%)";
      }
      ctx.fill();

      // Node border with glow effect
      ctx.strokeStyle = isHighlighted 
        ? (componentColor !== undefined
            ? COMPONENT_COLORS[componentColor % COMPONENT_COLORS.length]
            : "hsl(187 100% 50%)")
        : "hsl(187 100% 50%)";
      ctx.lineWidth = isHighlighted ? 3 : 2;
      
      if (isHighlighted) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = componentColor !== undefined
          ? COMPONENT_COLORS[componentColor % COMPONENT_COLORS.length]
          : "hsl(187 100% 50%)";
      }
      
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Node label
      ctx.fillStyle = isHighlighted ? "hsl(215 25% 6%)" : "hsl(215 25% 6%)";
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(node.toString(), pos.x, pos.y);
    });
  }, [graph, highlightedNodes, componentColors]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      className={className}
    />
  );
}
