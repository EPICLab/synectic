import dagre from 'dagre';
import { Edge, isEdge, isNode, MarkerType, Node } from 'reactflow';
import { colorSets } from './colors';
import { CommitVertex, GitGraph, Oid } from './hooks/useGitGraph';

const nodesep = 80;

const layoutGraph = (graph: GitGraph, topological: Oid[]): (Edge | Node)[] => {
  const elements: (Edge | Node)[] = [];
  for (const oid of topological) {
    const commit = graph.get(oid);
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
  graph.setGraph({ nodesep: nodesep });
  graph.setDefaultEdgeLabel(() => {
    return {};
  });

  rfGraph.filter(isNode).map(node => graph.setNode(node.id, { width: 5, height: 5 }));
  rfGraph.filter(isEdge).map(edge => graph.setEdge(edge.source, edge.target));
  dagre.layout(graph);

  return rfGraph.map(els => {
    if (isNode(els)) {
      const graphNode = graph.node(els.id);
      return { ...els, position: { x: graphNode.x, y: graphNode.y } };
    }
    return els;
  });
};

const getNode = (commit: CommitVertex): Node => {
  return {
    id: commit.oid,
    type: 'gitNode',
    data: {
      text: '',
      tooltip: '',
      color: commit.conflicted ? colorSets[9] : colorSets[5],
      border: commit.staged ? 'dashed' : '',
      opacity: commit.staged ? '0.6' : '1.0',
      branch: commit.head ? `${commit.scope}/${commit.branch}` : '',
      author: `${commit.author.name} <${commit.author.email}>`,
      message: commit.message
    },
    position: { x: 0, y: 0 }
  };
};

const getEdges = (commit: CommitVertex): Edge[] => {
  return commit.parents
    .filter(parent => parent.length > 0)
    .map(parent => ({
      id: `e${parent.slice(0, 7)}=${commit.staged ? commit.oid : commit.oid.slice(0, 7)}`,
      source: parent,
      target: commit.oid,
      animated: commit.staged ? true : false,
      arrowHeadType: MarkerType.ArrowClosed
    }));
};

export default layoutGraph;
