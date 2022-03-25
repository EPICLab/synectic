import React, { useEffect, useState } from 'react';
import ReactFlow, { addEdge, Connection, Edge, isEdge, isNode, ReactFlowInstance, useEdgesState, useNodesState } from 'react-flow-renderer';
import { nodeTypes } from './GitNode';
import useGitGraph from '../../containers/hooks/useGitGraph';
import layoutGraph from '../../containers/git-graph';
import { UUID } from '../../store/types';

const GitGraph = (props: { repo: UUID }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const onConnect = (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds));
  const onInit = (reactFlowInstance: ReactFlowInstance) => { setReactFlowState(reactFlowInstance) };

  const [reactFlowState, setReactFlowState] = useState<ReactFlowInstance>();
  const { graph, topological } = useGitGraph(props.repo);

  useEffect(() => { reactFlowState?.fitView() }, [nodes, edges]);

  useEffect(() => {
    const rfElements = layoutGraph(graph, topological);
    setNodes(rfElements.filter(isNode));
    setEdges(rfElements.filter(isEdge));
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