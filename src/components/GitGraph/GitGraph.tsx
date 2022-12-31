import React, { useEffect, useState } from 'react';
// eslint-disable-next-line import/no-named-as-default
import ReactFlow, { addEdge, Connection, Edge, isEdge, isNode, ReactFlowInstance, useEdgesState, useNodesState } from 'reactflow';
import 'reactflow/dist/style.css';
import { nodeTypes } from './GitNode';
import useGitGraph from '../../containers/hooks/useGitGraph';
import layoutGraph from '../../containers/git-graph';
import { UUID } from '../../store/types';

const GitGraph = ({ repo }: { repo: UUID }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const onConnect = (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds));
  const onInit = (reactFlowInstance: ReactFlowInstance) => { setReactFlowState(reactFlowInstance) };

  const [reactFlowState, setReactFlowState] = useState<ReactFlowInstance>();
  const { graph, topological } = useGitGraph(repo);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { reactFlowState?.fitView() }, [nodes, edges]);

  useEffect(() => {
    const rfElements = layoutGraph(graph, topological);
    setNodes(rfElements.filter(isNode));
    setEdges(rfElements.filter(isEdge));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph]);

  return (
    <>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onConnect={onConnect}
        onInit={onInit}
        fitView
        className='git-flow' />
    </>
  );
}

export default GitGraph;