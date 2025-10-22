import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input as InputField } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { GraphData, GraphEdge } from "@/types/graph";

export default function Input() {
  const navigate = useNavigate();
  const location = useLocation();
  const isDirected = location.state?.isDirected || false;

  const [adjacencyInput, setAdjacencyInput] = useState("");
  const [edgeCapacities, setEdgeCapacities] = useState("");

  const parseAdjacencyList = (): GraphData | null => {
    try {
      const lines = adjacencyInput.trim().split("\n");
      const adjacencyList = new Map<number, number[]>();
      const edges: GraphEdge[] = [];
      const capacityMap = new Map<string, number>();

      // Parse capacities if provided (for max flow)
      if (edgeCapacities.trim()) {
        const capLines = edgeCapacities.trim().split("\n");
        for (const line of capLines) {
          const [edge, cap] = line.trim().split(":");
          if (edge && cap) {
            const [from, to] = edge.trim().split(/\s+/).map(Number);
            if (!isNaN(from) && !isNaN(to) && !isNaN(Number(cap))) {
              capacityMap.set(`${from}-${to}`, Number(cap));
            }
          }
        }
      }

      for (const line of lines) {
        if (!line.trim()) continue;

        const parts = line.trim().split(":");
        if (parts.length !== 2) {
          toast.error("Invalid format. Each line should be: node: neighbor1 neighbor2 ...");
          return null;
        }

        const node = parseInt(parts[0].trim());
        if (isNaN(node)) {
          toast.error(`Invalid node number: ${parts[0]}`);
          return null;
        }

        const neighbors = parts[1].trim()
          ? parts[1].trim().split(/\s+/).map(n => {
              const num = parseInt(n);
              if (isNaN(num)) {
                throw new Error(`Invalid neighbor: ${n}`);
              }
              return num;
            })
          : [];

        adjacencyList.set(node, neighbors);

        // Create edges
        for (const neighbor of neighbors) {
          const capacity = capacityMap.get(`${node}-${neighbor}`) || 1;
          edges.push({ from: node, to: neighbor, capacity });

          if (!isDirected) {
            if (!adjacencyList.has(neighbor)) {
              adjacencyList.set(neighbor, []);
            }
            if (!adjacencyList.get(neighbor)!.includes(node)) {
              adjacencyList.get(neighbor)!.push(node);
              edges.push({ from: neighbor, to: node, capacity });
            }
          }
        }
      }

      // Ensure all nodes exist in adjacency list
      const allNodes = new Set<number>();
      for (const [node, neighbors] of adjacencyList.entries()) {
        allNodes.add(node);
        neighbors.forEach(n => allNodes.add(n));
      }

      for (const node of allNodes) {
        if (!adjacencyList.has(node)) {
          adjacencyList.set(node, []);
        }
      }

      if (adjacencyList.size === 0) {
        toast.error("Please enter at least one node");
        return null;
      }

      return { isDirected, adjacencyList, edges };
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invalid input format");
      return null;
    }
  };

  const handleVisualize = () => {
    const graph = parseAdjacencyList();
    if (graph) {
      navigate("/visualize", { state: { graph } });
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <Card className="p-8 border-2 border-primary/30 shadow-card">
          <h1 className="text-3xl font-bold mb-2 text-primary">
            Graph Input
          </h1>
          <p className="text-muted-foreground mb-6">
            Graph Type: <span className="text-primary font-semibold">{isDirected ? "Directed" : "Undirected"}</span>
          </p>

          <div className="space-y-6">
            <div>
              <Label htmlFor="adjacency" className="text-lg mb-2 block">
                Adjacency List
              </Label>
              <p className="text-sm text-muted-foreground mb-3">
                Enter each node and its neighbors in the format: <code className="text-primary">node: neighbor1 neighbor2 ...</code>
                <br />
                Example: <code className="text-primary">0: 1 2 3</code>
              </p>
              <Textarea
                id="adjacency"
                value={adjacencyInput}
                onChange={(e) => setAdjacencyInput(e.target.value)}
                placeholder="0: 1 2&#10;1: 0 2 3&#10;2: 0 1 3&#10;3: 1 2"
                className="font-mono min-h-[200px] bg-input border-primary/50 focus:border-primary"
                rows={10}
              />
            </div>

            {isDirected && (
              <div>
                <Label htmlFor="capacities" className="text-lg mb-2 block">
                  Edge Capacities (Optional - for Max Flow)
                </Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Enter capacities in format: <code className="text-primary">from to: capacity</code>
                  <br />
                  Example: <code className="text-primary">0 1: 10</code>
                </p>
                <Textarea
                  id="capacities"
                  value={edgeCapacities}
                  onChange={(e) => setEdgeCapacities(e.target.value)}
                  placeholder="0 1: 10&#10;1 2: 5&#10;2 3: 7"
                  className="font-mono min-h-[120px] bg-input border-primary/50 focus:border-primary"
                  rows={5}
                />
              </div>
            )}

            <Button
              onClick={handleVisualize}
              className="w-full text-lg py-6 bg-primary hover:bg-primary/90 shadow-glow"
              size="lg"
            >
              Visualize Graph
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
