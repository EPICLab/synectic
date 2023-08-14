import React, { useCallback, useEffect } from 'react';
import { BlurCircular, CenterFocusStrong } from '@mui/icons-material';
import { Typography } from '@mui/material';
// eslint-disable-next-line import/no-named-as-default
import ReactFlow, {
  addEdge,
  Connection,
  ControlButton,
  Controls,
  Edge,
  isEdge,
  isNode,
  useEdgesState,
  useNodesState
} from 'reactflow';
import 'reactflow/dist/style.css';
import layoutGraph from '../../containers/graph-layout';
import { useGitGraph } from '../../containers/hooks/useGitGraph';
import { UUID } from '../../store/types';
import { nodeTypes } from './GitNode';

const GitGraph = ({ repo }: { repo: UUID }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges(eds => addEdge(params, eds)),
    [setEdges]
  );

  const { graph, topological, printGraph: print } = useGitGraph(repo);
  const calculateLayout = useCallback(() => {
    const rfElements = layoutGraph(graph, topological);
    setNodes(rfElements.filter(isNode));
    setEdges(rfElements.filter(isEdge));
  }, [graph, setEdges, setNodes, topological]);

  useEffect(() => {
    calculateLayout();
  }, [calculateLayout, graph, topological]);

  return (
    <>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onConnect={onConnect}
        style={{ zIndex: 0 }}
        fitView
      >
        <Controls>
          <ControlButton onClick={calculateLayout} title="recalculate layout">
            <CenterFocusStrong style={{ maxWidth: 16, maxHeight: 16 }} />
          </ControlButton>
          <ControlButton onClick={print} title="expose graph">
            <BlurCircular style={{ maxWidth: 16, maxHeight: 16 }} />
          </ControlButton>
        </Controls>
        <Typography sx={{ pl: 1, pr: 1, position: 'absolute', bottom: 0, right: 60, fontSize: 12 }}>
          Nodes: {nodes.length}, Edges: {edges.length}
        </Typography>
      </ReactFlow>
    </>
  );
};

export default GitGraph;
