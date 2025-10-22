import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { GraphCanvas } from "@/components/GraphCanvas";
import { GraphData } from "@/types/graph";
import { bfs, dfs, findConnectedComponents } from "@/utils/graphAlgorithms";

export default function Visualize() {
  const navigate = useNavigate();
  const location = useLocation();
  const graph: GraphData = location.state?.graph;

  const [algorithm, setAlgorithm] = useState<"bfs" | "dfs">("bfs");
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [traversalOrder, setTraversalOrder] = useState<number[]>([]);
  const [highlightedNodes, setHighlightedNodes] = useState<Set<number>>(new Set());
  const [componentColors, setComponentColors] = useState<Map<number, number>>(new Map());
  const [components, setComponents] = useState<number[][]>([]);

  useEffect(() => {
    if (!graph) {
      navigate("/");
    }
  }, [graph, navigate]);

  useEffect(() => {
    // Calculate connected components
    if (graph) {
      const comps = findConnectedComponents(graph);
      setComponents(comps);
      
      const colorMap = new Map<number, number>();
      comps.forEach((comp, index) => {
        comp.forEach(node => {
          colorMap.set(node, index);
        });
      });
      setComponentColors(colorMap);
    }
  }, [graph]);

  const runAlgorithm = async () => {
    if (!graph) return;

    setIsRunning(true);
    setCurrentStep(0);
    setHighlightedNodes(new Set());
    setTraversalOrder([]);

    const startNode = Math.min(...Array.from(graph.adjacencyList.keys()));
    const allNodes = Array.from(graph.adjacencyList.keys());
    const visited = new Set<number>();
    const fullOrder: number[] = [];

    // Run algorithm on all components
    for (const node of allNodes) {
      if (!visited.has(node)) {
        const steps = algorithm === "bfs" ? bfs(graph, node) : dfs(graph, node);
        
        for (const step of steps) {
          visited.add(step.node);
          fullOrder.push(step.node);
          setHighlightedNodes(new Set(step.visited));
          setTraversalOrder([...fullOrder]);
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }
    }

    setIsRunning(false);
  };

  const handleReset = () => {
    setCurrentStep(0);
    setHighlightedNodes(new Set());
    setTraversalOrder([]);
    setIsRunning(false);
  };

  const handleAdvancedAnalysis = () => {
    navigate("/advanced", { state: { graph } });
  };

  if (!graph) return null;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/input", { state: { isDirected: graph.isDirected } })}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Input
          </Button>

          <Button
            onClick={handleAdvancedAnalysis}
            className="bg-gradient-secondary hover:opacity-90"
            size="lg"
          >
            Advanced Analysis
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-6 border-2 border-primary/30 shadow-card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-primary">Graph Visualization</h2>
              {components.length > 1 && (
                <p className="text-lg font-semibold text-purple-400">
                  Connected Components: {components.length}
                </p>
              )}
            </div>
            <div className="bg-secondary/50 rounded-lg p-4 border border-primary/20">
              <GraphCanvas 
                graph={graph} 
                highlightedNodes={highlightedNodes}
                componentColors={componentColors}
                className="w-full"
              />
            </div>
          </Card>

          <div className="space-y-6">
            <Card className="p-6 border-2 border-primary/30 shadow-card">
              <h2 className="text-2xl font-bold mb-6 text-primary">Algorithm Selection</h2>
              
              <RadioGroup value={algorithm} onValueChange={(v) => setAlgorithm(v as "bfs" | "dfs")}>
                <div className="flex items-center space-x-2 mb-3">
                  <RadioGroupItem value="bfs" id="bfs" />
                  <Label htmlFor="bfs" className="text-lg cursor-pointer">
                    Breadth-First Search (BFS)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dfs" id="dfs" />
                  <Label htmlFor="dfs" className="text-lg cursor-pointer">
                    Depth-First Search (DFS)
                  </Label>
                </div>
              </RadioGroup>

              <div className="mt-6 space-y-3">
                <Button
                  onClick={runAlgorithm}
                  disabled={isRunning}
                  className="w-full py-6 text-lg bg-primary hover:bg-primary/90 shadow-glow"
                  size="lg"
                >
                  {isRunning ? "Running..." : "Run Algorithm"}
                </Button>

                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="w-full py-6 text-lg"
                  size="lg"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
              </div>
            </Card>

            {(traversalOrder.length > 0 || components.length > 0) && (
              <Card className="p-6 border-2 border-primary/30 shadow-card">
                <h2 className="text-2xl font-bold mb-4 text-purple-400">Results</h2>
                
                {components.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-primary mb-2">
                      Connected Components: {components.length}
                    </h3>
                    {components.map((comp, idx) => (
                      <p key={idx} className="text-sm text-foreground mb-1">
                        Component {idx + 1}: {comp.join(", ")}
                      </p>
                    ))}
                  </div>
                )}

                {traversalOrder.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-primary mb-2">
                      Traversal Order
                    </h3>
                    <p className="text-foreground font-mono">
                      {traversalOrder.join(" → ")}
                    </p>
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
