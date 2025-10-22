import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const Index = () => {
  const navigate = useNavigate();
  const [graphType, setGraphType] = useState<"directed" | "undirected" | null>(null);

  const handleSelection = (type: "directed" | "undirected") => {
    setGraphType(type);
    navigate("/input", { state: { isDirected: type === "directed" } });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <Card className="max-w-2xl w-full p-12 border-2 border-primary/30 shadow-card">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            Graph Visualizer
          </h1>
          <p className="text-xl text-muted-foreground">
            Advanced graph analysis and visualization tool
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-primary text-center mb-6">
            Select Graph Type
          </h2>

          <Button
            onClick={() => handleSelection("undirected")}
            className="w-full py-8 text-xl bg-primary hover:bg-primary/90 shadow-glow transition-all hover:scale-105"
            size="lg"
          >
            Undirected Graph
          </Button>

          <Button
            onClick={() => handleSelection("directed")}
            className="w-full py-8 text-xl bg-gradient-secondary hover:opacity-90 shadow-glow transition-all hover:scale-105"
            size="lg"
          >
            Directed Graph
          </Button>
        </div>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Supports BFS, DFS, Connected Components, Articulation Points,</p>
          <p>Biconnected Components, Strongly Connected Components & Max Flow</p>
        </div>
      </Card>
    </div>
  );
};

export default Index;
