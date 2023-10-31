import type {UUID} from '@syn-types/app';
import dagre from 'dagre';
import type {Edge, Node} from 'reactflow';
import {MarkerType, isEdge, isNode} from 'reactflow';
import type {CommitGraph, CommitVertex} from './hooks/useGitGraph';

const nodesep = 80;

const layoutGraph = (graph: CommitGraph, topological: UUID[]): (Edge | Node)[] => {
  const elements: (Edge | Node)[] = [];
  for (const oid of topological) {
    const commit = graph.get(oid.toString());
    if (commit) {
      const node: Node = getNode(commit);
      const edges: Edge[] = getEdges(commit);
      elements.push(node);
      edges.map(edge => elements.push(edge));
    }
  }
  return layoutOptimizer(elements);
};

const layoutOptimizer = (rfGraph: (Edge | Node)[]): (Edge | Node)[] => {
  const graph = new dagre.graphlib.Graph();
  graph.setGraph({nodesep: nodesep});
  graph.setDefaultEdgeLabel(() => {
    return {};
  });

  rfGraph.filter(isNode).map(node => graph.setNode(node.id, {width: 5, height: 5}));
  rfGraph.filter(isEdge).map(edge => graph.setEdge(edge.source, edge.target));
  dagre.layout(graph);

  return rfGraph.map(els => {
    if (isNode(els)) {
      const graphNode = graph.node(els.id);
      return {...els, position: {x: graphNode.x, y: graphNode.y}};
    }
    return els;
  });
};

const getNode = (commit: CommitVertex): Node<CommitVertex> => {
  return {
    id: commit.oid.toString(),
    type: 'gitNode',
    data: commit,
    position: {x: 0, y: 0},
  };
};

const getEdges = (commit: CommitVertex): Edge[] => {
  return commit.parents
    .filter(parent => parent.length > 0)
    .map(parent => ({
      id: `e${parent.toString().slice(0, 7)}=${
        commit.staged ? commit.oid.toString() : commit.oid.toString().slice(0, 7)
      }`,
      source: parent.toString(),
      target: commit.oid.toString(),
      animated: commit.staged ? true : false,
      arrowHeadType: MarkerType.ArrowClosed,
    }));
};

export default layoutGraph;
