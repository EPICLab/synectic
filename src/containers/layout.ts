import dagre from 'dagre';
import { FlowElement, isNode, isEdge } from 'react-flow-renderer';

export const layoutOptimizer = (rfGraph: Array<FlowElement>): Array<FlowElement> => {
  const graph = new dagre.graphlib.Graph();
  graph.setGraph({});
  graph.setDefaultEdgeLabel(() => { return {}; });

  rfGraph.filter(isNode).map(node => graph.setNode(node.id, { width: 10, height: 10 }));
  rfGraph.filter(isEdge).map(edge => graph.setEdge(edge.source, edge.target));
  dagre.layout(graph);

  return rfGraph.map(els => {
    if (isNode(els)) {
      const graphNode = graph.node(els.id);
      return { ...els, position: { x: graphNode.x, y: graphNode.y } };
    }
    return els;
  });
}