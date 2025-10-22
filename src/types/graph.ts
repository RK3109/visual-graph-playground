export interface GraphEdge {
  from: number;
  to: number;
  capacity?: number;
}

export interface GraphData {
  isDirected: boolean;
  adjacencyList: Map<number, number[]>;
  edges: GraphEdge[];
}

export interface TraversalStep {
  node: number;
  visited: Set<number>;
  component?: number;
}

export interface AnalysisResults {
  articulationPoints?: number[];
  bridges?: [number, number][];
  biconnectedComponents?: number[][];
  stronglyConnectedComponents?: number[][];
  maxFlow?: {
    value: number;
    source: number;
    sink: number;
  };
}
