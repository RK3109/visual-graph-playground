import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft, RotateCcw, Pause, Play } from "lucide-react";
import { GraphCanvas } from "@/components/GraphCanvas";
import { GraphData } from "@/types/graph";
import { bfs, dfs, findConnectedComponents } from "@/utils/graphAlgorithms";

export default function Visualize() {
  const navigate = useNavigate();
  const location = useLocation();
  const graph: GraphData = location.state?.graph;

  const [algorithm, setAlgorithm] = useState<"bfs" | "dfs">("bfs");
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [traversalOrder, setTraversalOrder] = useState<number[]>([]);
  const [highlightedNodes, setHighlightedNodes] = useState<Set<number>>(new Set());
  const [componentColors, setComponentColors] = useState<Map<number, number>>(new Map());
  const [components, setComponents] = useState<number[][]>([]);
  const [currentPseudocodeLine, setCurrentPseudocodeLine] = useState<number>(0);
  const pauseRef = useRef(false);

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
    setIsPaused(false);
    pauseRef.current = false;
    setCurrentStep(0);
    setHighlightedNodes(new Set());
    setTraversalOrder([]);
    setCurrentPseudocodeLine(0);

    const allNodes = Array.from(graph.adjacencyList.keys());
    const visited = new Set<number>();
    const fullOrder: number[] = [];

    // Run algorithm on all components
    for (const node of allNodes) {
      if (!visited.has(node)) {
        const steps = algorithm === "bfs" ? bfs(graph, node) : dfs(graph, node);
        
        for (let i = 0; i < steps.length; i++) {
          const step = steps[i];
          
          // Check for pause
          while (pauseRef.current) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
          visited.add(step.node);
          fullOrder.push(step.node);
          setHighlightedNodes(new Set(step.visited));
          setTraversalOrder([...fullOrder]);
          
          // Update pseudocode line
          if (algorithm === "bfs") {
            setCurrentPseudocodeLine((i % 5) + 1);
          } else {
            setCurrentPseudocodeLine((i % 4) + 1);
          }
          
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }
    }

    setIsRunning(false);
    setCurrentPseudocodeLine(0);
  };

  const handleReset = () => {
    setCurrentStep(0);
    setHighlightedNodes(new Set());
    setTraversalOrder([]);
    setIsRunning(false);
    setIsPaused(false);
    setCurrentPseudocodeLine(0);
    pauseRef.current = false;
  };

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
    pauseRef.current = !pauseRef.current;
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

                {isRunning && (
                  <Button
                    onClick={handlePauseResume}
                    variant="secondary"
                    className="w-full py-6 text-lg"
                    size="lg"
                  >
                    {isPaused ? (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Resume
                      </>
                    ) : (
                      <>
                        <Pause className="mr-2 h-4 w-4" />
                        Pause
                      </>
                    )}
                  </Button>
                )}

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

            <Card className="p-6 border-2 border-primary/30 shadow-card">
              <h2 className="text-2xl font-bold mb-4 text-purple-400">Pseudocode</h2>
              <div className="bg-secondary/30 rounded-lg p-4 font-mono text-sm space-y-1">
                {algorithm === "bfs" ? (
                  <>
                    <div className={currentPseudocodeLine === 1 ? "bg-primary/30 px-2 py-1 rounded" : "px-2 py-1"}>1. Initialize queue with start node</div>
                    <div className={currentPseudocodeLine === 2 ? "bg-primary/30 px-2 py-1 rounded" : "px-2 py-1"}>2. While queue is not empty:</div>
                    <div className={currentPseudocodeLine === 3 ? "bg-primary/30 px-2 py-1 rounded" : "px-2 py-1"}>3.   Dequeue node and visit it</div>
                    <div className={currentPseudocodeLine === 4 ? "bg-primary/30 px-2 py-1 rounded" : "px-2 py-1"}>4.   For each unvisited neighbor:</div>
                    <div className={currentPseudocodeLine === 5 ? "bg-primary/30 px-2 py-1 rounded" : "px-2 py-1"}>5.     Mark as visited, enqueue</div>
                  </>
                ) : (
                  <>
                    <div className={currentPseudocodeLine === 1 ? "bg-primary/30 px-2 py-1 rounded" : "px-2 py-1"}>1. Mark current node as visited</div>
                    <div className={currentPseudocodeLine === 2 ? "bg-primary/30 px-2 py-1 rounded" : "px-2 py-1"}>2. For each unvisited neighbor:</div>
                    <div className={currentPseudocodeLine === 3 ? "bg-primary/30 px-2 py-1 rounded" : "px-2 py-1"}>3.   Recursively call DFS</div>
                    <div className={currentPseudocodeLine === 4 ? "bg-primary/30 px-2 py-1 rounded" : "px-2 py-1"}>4. Backtrack to previous node</div>
                  </>
                )}
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
