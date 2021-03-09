import React, { useEffect, useState } from 'react';
import ReactFlow, { addEdge, Connection, Edge, FlowElement, OnLoadFunc, OnLoadParams } from 'react-flow-renderer';

import type { UUID } from '../types';
import { nodeTypes } from './GitNode';
import { useGitHistory } from '../store/hooks/useGitHistory';
import { useSelector } from 'react-redux';
import { RootState } from '../store/root';
import { asyncGraphConstruction } from '../containers/git-graph';

export const GitGraph: React.FunctionComponent<{ repo: UUID }> = props => {
  const repo = useSelector((state: RootState) => state.repos[props.repo]);
  const [elements, setElements] = useState<Array<FlowElement>>([]);
  const [reactFlowState, setReactFlowState] = useState<OnLoadParams>();
  const onConnect = (params: Edge | Connection) => setElements((els) => addEdge(params, els));
  const { commits, heads, update } = useGitHistory(repo);
  const onLoad: OnLoadFunc = (rf) => { setReactFlowState(rf) };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { update() }, [props.repo]);

  useEffect(() => {
    if (reactFlowState && elements.length) {
      reactFlowState.fitView();
    }
  }, [elements, reactFlowState]);

  useEffect(() => {
    const asyncFetchGraph = async () => setElements(await asyncGraphConstruction(commits, heads, repo));
    asyncFetchGraph();
  }, [commits, heads, repo]);

  return (<ReactFlow
    elements={elements}
    nodeTypes={nodeTypes}
    onConnect={onConnect}
    onLoad={onLoad}
    onNodeMouseEnter={(_event, node) => console.log(node.id)}
    className='git-flow' />);
}

export default GitGraph;