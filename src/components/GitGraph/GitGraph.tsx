import React, { useEffect, useState } from 'react';
import ReactFlow, { addEdge, Connection, Edge, FlowElement, OnLoadFunc, OnLoadParams } from 'react-flow-renderer';
import { Info } from '@material-ui/icons';
import type { UUID } from '../../types';
import { nodeTypes } from './GitNode';
import useGitGraph from '../../containers/hooks/useGitGraph';
import { IconButton } from '@material-ui/core';
import layoutGraph from '../../containers/git-graph';

export const GitGraph: React.FunctionComponent<{ repo: UUID }> = props => {
  const [elements, setElements] = useState<FlowElement[]>([]);
  const [reactFlowState, setReactFlowState] = useState<OnLoadParams>();
  const { graph, topological, print } = useGitGraph(props.repo);

  const onConnect = (params: Edge | Connection) => setElements((els) => addEdge(params, els));
  const onLoad: OnLoadFunc = (rf) => { setReactFlowState(rf) };

  useEffect(() => { reactFlowState?.fitView() }, [elements]);

  useEffect(() => {
    setElements(layoutGraph(graph, topological));
  }, [graph]);

  return (
    <>
      <IconButton aria-label='print-graph' onClick={() => print()}>
        <Info />
      </IconButton>
      <ReactFlow
        elements={elements}
        nodeTypes={nodeTypes}
        onConnect={onConnect}
        onLoad={onLoad}
        className='git-flow' />
    </>
  );
}

export default GitGraph;