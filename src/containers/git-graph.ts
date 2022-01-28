import dagre from 'dagre';
import { ArrowHeadType, Edge, FlowElement, isEdge, isNode, Node } from 'react-flow-renderer';
import { colorSets } from './colors';
import { CommitVertex, GitGraph } from './hooks/useGitGraph';

const nodesep = 80;

const layoutGraph = (graph: GitGraph, topological: string[]): FlowElement[] => {
    const elements: FlowElement[] = [];
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
}

const layoutOptimizer = (rfGraph: FlowElement[]): FlowElement[] => {
    const graph = new dagre.graphlib.Graph();
    graph.setGraph({ nodesep: nodesep });
    graph.setDefaultEdgeLabel(() => { return {}; });

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
}

const getNode = (commit: CommitVertex): Node => {
    return {
        id: commit.oid,
        type: 'gitNode',
        data: {
            text: '',
            tooltip: '',
            color: colorSets[5],
            border: '',
            branch: commit.head ? `${commit.scope}/${commit.branch}` : ''
        },
        position: { x: 0, y: 0 }
    };
}

const getEdges = (commit: CommitVertex): Edge[] => {
    return commit.parents.map(parent => ({
        id: `e${parent.slice(0, 7)}=${commit.oid.slice(0, 7)}`,
        source: parent,
        target: commit.oid,
        arrowHeadType: ArrowHeadType.ArrowClosed
    }));
}

const getStagedNode = (commit: CommitVertex): Node => {
    return {
        id: `${commit.scope}/${commit.branch}*`,
        type: 'gitNode',
        data: {
            text: '',
            tooltip: '',
            color: colorSets[5],
            border: 'dashed',
            opacity: '0.6',
            branch: `${commit.scope}/${commit.branch}*`
        },
        position: { x: 0, y: 0 }
    };
}

const getStagedEdge = (commit: CommitVertex): Edge => {
    return {
        id: `e${commit.oid.slice(0, 7)}-${commit.scope}/${commit.branch}*`,
        source: commit.oid,
        target: `${commit.scope}/${commit.branch}*`,
        animated: true,
        arrowHeadType: ArrowHeadType.ArrowClosed
    };
}

export default layoutGraph;