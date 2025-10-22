import { GraphData, TraversalStep, AnalysisResults } from "@/types/graph";

export function bfs(graph: GraphData, startNode: number): TraversalStep[] {
  const steps: TraversalStep[] = [];
  const visited = new Set<number>();
  const queue: number[] = [startNode];
  
  visited.add(startNode);
  
  while (queue.length > 0) {
    const node = queue.shift()!;
    steps.push({ node, visited: new Set(visited) });
    
    const neighbors = graph.adjacencyList.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
  
  return steps;
}

export function dfs(graph: GraphData, startNode: number): TraversalStep[] {
  const steps: TraversalStep[] = [];
  const visited = new Set<number>();
  
  function dfsHelper(node: number) {
    visited.add(node);
    steps.push({ node, visited: new Set(visited) });
    
    const neighbors = graph.adjacencyList.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        dfsHelper(neighbor);
      }
    }
  }
  
  dfsHelper(startNode);
  return steps;
}

export function findConnectedComponents(graph: GraphData): number[][] {
  const visited = new Set<number>();
  const components: number[][] = [];
  const nodes = Array.from(graph.adjacencyList.keys());
  
  for (const node of nodes) {
    if (!visited.has(node)) {
      const component: number[] = [];
      const queue = [node];
      visited.add(node);
      
      while (queue.length > 0) {
        const current = queue.shift()!;
        component.push(current);
        
        const neighbors = graph.adjacencyList.get(current) || [];
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            queue.push(neighbor);
          }
        }
      }
      
      components.push(component.sort((a, b) => a - b));
    }
  }
  
  return components;
}

export function findArticulationPoints(graph: GraphData): { points: number[]; bridges: [number, number][] } {
  const nodes = Array.from(graph.adjacencyList.keys());
  const visited = new Set<number>();
  const disc = new Map<number, number>();
  const low = new Map<number, number>();
  const parent = new Map<number, number | null>();
  const articulationPoints = new Set<number>();
  const bridges: [number, number][] = [];
  let time = 0;
  
  function dfsAP(u: number) {
    let children = 0;
    visited.add(u);
    disc.set(u, time);
    low.set(u, time);
    time++;
    
    const neighbors = graph.adjacencyList.get(u) || [];
    for (const v of neighbors) {
      if (!visited.has(v)) {
        children++;
        parent.set(v, u);
        dfsAP(v);
        
        low.set(u, Math.min(low.get(u)!, low.get(v)!));
        
        if (parent.get(u) === null && children > 1) {
          articulationPoints.add(u);
        }
        
        if (parent.get(u) !== null && low.get(v)! >= disc.get(u)!) {
          articulationPoints.add(u);
        }
        
        if (low.get(v)! > disc.get(u)!) {
          bridges.push([u, v]);
        }
      } else if (v !== parent.get(u)) {
        low.set(u, Math.min(low.get(u)!, disc.get(v)!));
      }
    }
  }
  
  for (const node of nodes) {
    if (!visited.has(node)) {
      parent.set(node, null);
      dfsAP(node);
    }
  }
  
  return { points: Array.from(articulationPoints), bridges };
}

export function findBiconnectedComponents(graph: GraphData): number[][] {
  const nodes = Array.from(graph.adjacencyList.keys());
  const visited = new Set<number>();
  const disc = new Map<number, number>();
  const low = new Map<number, number>();
  const parent = new Map<number, number | null>();
  const stack: [number, number][] = [];
  const biconnectedComponents: number[][] = [];
  let time = 0;
  
  function dfsBCC(u: number) {
    let children = 0;
    visited.add(u);
    disc.set(u, time);
    low.set(u, time);
    time++;
    
    const neighbors = graph.adjacencyList.get(u) || [];
    for (const v of neighbors) {
      if (!visited.has(v)) {
        children++;
        parent.set(v, u);
        stack.push([u, v]);
        dfsBCC(v);
        
        low.set(u, Math.min(low.get(u)!, low.get(v)!));
        
        if ((parent.get(u) === null && children > 1) || 
            (parent.get(u) !== null && low.get(v)! >= disc.get(u)!)) {
          const component = new Set<number>();
          let edge: [number, number] | undefined;
          
          do {
            edge = stack.pop();
            if (edge) {
              component.add(edge[0]);
              component.add(edge[1]);
            }
          } while (edge && (edge[0] !== u || edge[1] !== v));
          
          biconnectedComponents.push(Array.from(component).sort((a, b) => a - b));
        }
      } else if (v !== parent.get(u) && disc.get(v)! < disc.get(u)!) {
        stack.push([u, v]);
        low.set(u, Math.min(low.get(u)!, disc.get(v)!));
      }
    }
  }
  
  for (const node of nodes) {
    if (!visited.has(node)) {
      parent.set(node, null);
      dfsBCC(node);
      
      if (stack.length > 0) {
        const component = new Set<number>();
        while (stack.length > 0) {
          const edge = stack.pop()!;
          component.add(edge[0]);
          component.add(edge[1]);
        }
        biconnectedComponents.push(Array.from(component).sort((a, b) => a - b));
      }
    }
  }
  
  return biconnectedComponents;
}

export function findStronglyConnectedComponents(graph: GraphData): number[][] {
  if (!graph.isDirected) return [];
  
  const nodes = Array.from(graph.adjacencyList.keys());
  const visited = new Set<number>();
  const stack: number[] = [];
  
  function dfs1(node: number) {
    visited.add(node);
    const neighbors = graph.adjacencyList.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        dfs1(neighbor);
      }
    }
    stack.push(node);
  }
  
  for (const node of nodes) {
    if (!visited.has(node)) {
      dfs1(node);
    }
  }
  
  const transposed = new Map<number, number[]>();
  for (const node of nodes) {
    transposed.set(node, []);
  }
  
  for (const [node, neighbors] of graph.adjacencyList.entries()) {
    for (const neighbor of neighbors) {
      const list = transposed.get(neighbor) || [];
      list.push(node);
      transposed.set(neighbor, list);
    }
  }
  
  visited.clear();
  const sccs: number[][] = [];
  
  function dfs2(node: number, component: number[]) {
    visited.add(node);
    component.push(node);
    const neighbors = transposed.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        dfs2(neighbor, component);
      }
    }
  }
  
  while (stack.length > 0) {
    const node = stack.pop()!;
    if (!visited.has(node)) {
      const component: number[] = [];
      dfs2(node, component);
      sccs.push(component.sort((a, b) => a - b));
    }
  }
  
  return sccs;
}

export function maxFlow(graph: GraphData, source: number, sink: number): number {
  if (!graph.isDirected) return 0;
  
  const capacity = new Map<string, number>();
  for (const edge of graph.edges) {
    const key = `${edge.from}-${edge.to}`;
    capacity.set(key, edge.capacity || 1);
  }
  
  const residualGraph = new Map<number, Map<number, number>>();
  const nodes = Array.from(graph.adjacencyList.keys());
  
  for (const node of nodes) {
    residualGraph.set(node, new Map());
  }
  
  for (const [key, cap] of capacity.entries()) {
    const [from, to] = key.split('-').map(Number);
    residualGraph.get(from)!.set(to, cap);
    if (!residualGraph.get(to)!.has(from)) {
      residualGraph.get(to)!.set(from, 0);
    }
  }
  
  function bfsPath(): number[] | null {
    const visited = new Set<number>([source]);
    const queue: number[] = [source];
    const parent = new Map<number, number>();
    
    while (queue.length > 0) {
      const u = queue.shift()!;
      
      if (u === sink) {
        const path: number[] = [];
        let current = sink;
        while (current !== source) {
          path.unshift(current);
          current = parent.get(current)!;
        }
        path.unshift(source);
        return path;
      }
      
      const neighbors = residualGraph.get(u)!;
      for (const [v, cap] of neighbors.entries()) {
        if (!visited.has(v) && cap > 0) {
          visited.add(v);
          parent.set(v, u);
          queue.push(v);
        }
      }
    }
    
    return null;
  }
  
  let totalFlow = 0;
  
  while (true) {
    const path = bfsPath();
    if (!path) break;
    
    let pathFlow = Infinity;
    for (let i = 0; i < path.length - 1; i++) {
      const u = path[i];
      const v = path[i + 1];
      pathFlow = Math.min(pathFlow, residualGraph.get(u)!.get(v)!);
    }
    
    for (let i = 0; i < path.length - 1; i++) {
      const u = path[i];
      const v = path[i + 1];
      residualGraph.get(u)!.set(v, residualGraph.get(u)!.get(v)! - pathFlow);
      residualGraph.get(v)!.set(u, residualGraph.get(v)!.get(u)! + pathFlow);
    }
    
    totalFlow += pathFlow;
  }
  
  return totalFlow;
}
