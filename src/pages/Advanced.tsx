import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input as InputField } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { GraphCanvas } from "@/components/GraphCanvas";
import { GraphData } from "@/types/graph";
import {
  findArticulationPoints,
  findBiconnectedComponents,
  findStronglyConnectedComponents,
  maxFlow,
} from "@/utils/graphAlgorithms";
import { toast } from "sonner";

export default function Advanced() {
  const navigate = useNavigate();
  const location = useLocation();
  const graph: GraphData = location.state?.graph;

  const [selectedOptions, setSelectedOptions] = useState({
    articulationPoints: false,
    biconnected: false,
    stronglyConnected: false,
    maxFlow: false,
  });

  const [maxFlowSource, setMaxFlowSource] = useState("");
  const [maxFlowSink, setMaxFlowSink] = useState("");
  const [results, setResults] = useState<any>({});
  const [showAfterRemoval, setShowAfterRemoval] = useState(false);
  const [modifiedGraph, setModifiedGraph] = useState<GraphData | null>(null);

  useEffect(() => {
    if (!graph) {
      navigate("/");
    }
  }, [graph, navigate]);

  const handleRunAnalysis = () => {
    if (!graph) return;

    const newResults: any = {};

    if (selectedOptions.articulationPoints) {
      const { points, bridges } = findArticulationPoints(graph);
      newResults.articulationPoints = points;
      newResults.bridges = bridges;
    }

    if (selectedOptions.biconnected) {
      const components = findBiconnectedComponents(graph);
      newResults.biconnectedComponents = components;
    }

    if (selectedOptions.stronglyConnected && graph.isDirected) {
      const components = findStronglyConnectedComponents(graph);
      newResults.stronglyConnectedComponents = components;
    }

    if (selectedOptions.maxFlow) {
      const source = parseInt(maxFlowSource);
      const sink = parseInt(maxFlowSink);

      if (isNaN(source) || isNaN(sink)) {
        toast.error("Invalid source or sink value");
        return;
      }

      if (!graph.adjacencyList.has(source)) {
        toast.error(`Invalid source node: ${source}`);
        return;
      }

      if (!graph.adjacencyList.has(sink)) {
        toast.error(`Invalid sink node: ${sink}`);
        return;
      }

      if (source === sink) {
        toast.error("Source and sink must be different nodes");
        return;
      }

      const flow = maxFlow(graph, source, sink);
      newResults.maxFlow = { value: flow, source, sink };
    }

    setResults(newResults);
    toast.success("Analysis complete!");
  };

  const handleShowAfterRemoval = () => {
    if (!graph || !results.articulationPoints) return;

    const newAdjList = new Map<number, number[]>();
    
    for (const [node, neighbors] of graph.adjacencyList.entries()) {
      if (results.articulationPoints.includes(node)) continue;
      
      const filteredNeighbors = neighbors.filter(
        n => !results.articulationPoints.includes(n)
      );
      newAdjList.set(node, filteredNeighbors);
    }

    const newEdges = graph.edges.filter(
      edge => !results.articulationPoints.includes(edge.from) && 
              !results.articulationPoints.includes(edge.to)
    );

    setModifiedGraph({
      ...graph,
      adjacencyList: newAdjList,
      edges: newEdges,
    });
    setShowAfterRemoval(true);
  };

  if (!graph) return null;

  const displayGraph = showAfterRemoval && modifiedGraph ? modifiedGraph : graph;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/visualize", { state: { graph } })}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Visualization
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-6 border-2 border-primary/30 shadow-card">
            <h2 className="text-2xl font-bold mb-4 text-primary">
              Advanced Graph Analysis
            </h2>
            <div className="bg-secondary/50 rounded-lg p-4 border border-primary/20">
              <GraphCanvas 
                graph={displayGraph} 
                className="w-full"
                articulationPoints={results.articulationPoints}
              />
            </div>
            {showAfterRemoval && (
              <Button
                onClick={() => setShowAfterRemoval(false)}
                variant="outline"
                className="mt-4"
              >
                Show Original Graph
              </Button>
            )}
          </Card>

          <div className="space-y-6">
            <Card className="p-6 border-2 border-primary/30 shadow-card">
              <h2 className="text-2xl font-bold mb-6 text-primary">Analysis Options</h2>

              <div className="space-y-4 mb-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="articulation"
                    checked={selectedOptions.articulationPoints}
                    onCheckedChange={(checked) =>
                      setSelectedOptions({ ...selectedOptions, articulationPoints: checked as boolean })
                    }
                  />
                  <Label htmlFor="articulation" className="cursor-pointer">
                    Articulation Points & Bridges
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="biconnected"
                    checked={selectedOptions.biconnected}
                    onCheckedChange={(checked) =>
                      setSelectedOptions({ ...selectedOptions, biconnected: checked as boolean })
                    }
                  />
                  <Label htmlFor="biconnected" className="cursor-pointer">
                    Biconnected Components
                  </Label>
                </div>

                {graph.isDirected && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="strongly"
                      checked={selectedOptions.stronglyConnected}
                      onCheckedChange={(checked) =>
                        setSelectedOptions({ ...selectedOptions, stronglyConnected: checked as boolean })
                      }
                    />
                    <Label htmlFor="strongly" className="cursor-pointer">
                      Strongly Connected Components
                    </Label>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="maxflow"
                    checked={selectedOptions.maxFlow}
                    onCheckedChange={(checked) =>
                      setSelectedOptions({ ...selectedOptions, maxFlow: checked as boolean })
                    }
                  />
                  <Label htmlFor="maxflow" className="cursor-pointer">
                    Maximum Flow
                  </Label>
                </div>

                {selectedOptions.maxFlow && (
                  <div className="ml-6 space-y-3 mt-2">
                    <div>
                      <Label htmlFor="source" className="text-sm">Source Node</Label>
                      <InputField
                        id="source"
                        type="number"
                        value={maxFlowSource}
                        onChange={(e) => setMaxFlowSource(e.target.value)}
                        placeholder="Enter source"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="sink" className="text-sm">Sink Node</Label>
                      <InputField
                        id="sink"
                        type="number"
                        value={maxFlowSink}
                        onChange={(e) => setMaxFlowSink(e.target.value)}
                        placeholder="Enter sink"
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}
              </div>

              <Button
                onClick={handleRunAnalysis}
                className="w-full py-6 text-lg bg-gradient-secondary hover:opacity-90 shadow-glow"
                size="lg"
              >
                Run Analysis
              </Button>
            </Card>

            {Object.keys(results).length > 0 && (
              <Card className="p-6 border-2 border-primary/30 shadow-card overflow-y-auto max-h-[600px]">
                <h2 className="text-2xl font-bold mb-4 text-purple-400">Analysis Results</h2>

                {results.articulationPoints !== undefined && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-yellow-400 mb-2">
                      Articulation Points & Bridges
                    </h3>
                    {results.articulationPoints.length > 0 ? (
                      <>
                        <p className="text-sm text-foreground mb-2">
                          Articulation Points: {results.articulationPoints.join(", ")}
                        </p>
                        {results.bridges && results.bridges.length > 0 && (
                          <p className="text-sm text-foreground mb-3">
                            Bridges: {results.bridges.map((b: [number, number]) => `(${b[0]}, ${b[1]})`).join(", ")}
                          </p>
                        )}
                        <Button
                          onClick={handleShowAfterRemoval}
                          variant="outline"
                          size="sm"
                          className="mt-2"
                        >
                          Show Graph After Removal
                        </Button>
                      </>
                    ) : (
                      <p className="text-sm text-foreground">
                        No articulation points or bridges found. The graph is biconnected.
                      </p>
                    )}
                  </div>
                )}

                {results.biconnectedComponents && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-yellow-400 mb-2">
                      Biconnected Components
                    </h3>
                    <p className="text-sm text-foreground mb-2">
                      Total: {results.biconnectedComponents.length}
                    </p>
                    {results.biconnectedComponents.map((comp: number[], idx: number) => (
                      <p key={idx} className="text-sm text-foreground">
                        Component {idx + 1}: {comp.join(", ")}
                      </p>
                    ))}
                  </div>
                )}

                {results.stronglyConnectedComponents && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-yellow-400 mb-2">
                      Strongly Connected Components
                    </h3>
                    <p className="text-sm text-foreground mb-2">
                      Total: {results.stronglyConnectedComponents.length}
                    </p>
                    {results.stronglyConnectedComponents.map((comp: number[], idx: number) => (
                      <p key={idx} className="text-sm text-foreground">
                        SCC {idx + 1}: {comp.join(", ")}
                      </p>
                    ))}
                  </div>
                )}

                {results.maxFlow !== undefined && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-yellow-400 mb-2">
                      Maximum Flow
                    </h3>
                    {results.maxFlow.value > 0 ? (
                      <>
                        <p className="text-2xl font-bold text-primary mb-2">
                          {results.maxFlow.value}
                        </p>
                        <p className="text-sm text-foreground">
                          From node {results.maxFlow.source} to node {results.maxFlow.sink}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-xl font-bold text-foreground mb-2">
                          0
                        </p>
                        <p className="text-sm text-foreground">
                          No flow exists from node {results.maxFlow.source} to node {results.maxFlow.sink}
                        </p>
                      </>
                    )}
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
