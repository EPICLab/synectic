import React, { useEffect, useState } from 'react';
import ReactFlow, { addEdge, Connection, Edge, FlowElement, OnLoadFunc, OnLoadParams } from 'react-flow-renderer';

import type { UUID } from '../../types';
import { nodeTypes } from './GitNode';
import { useGitHistory } from '../../containers/hooks/useGitHistory';
import { RootState } from '../../store/store';
import { graphConstruction } from '../../containers/git-graph';
import repoSelectors from '../../store/selectors/repos';
import { useAppSelector } from '../../store/hooks';


export const GitGraph: React.FunctionComponent<{ repo: UUID }> = props => {
  const [elements, setElements] = useState<Array<FlowElement>>([]);
  const [reactFlowState, setReactFlowState] = useState<OnLoadParams>();
  const onConnect = (params: Edge | Connection) => setElements((els) => addEdge(params, els));
  const onLoad: OnLoadFunc = (rf) => { setReactFlowState(rf) };
  const repo = useAppSelector((state: RootState) => repoSelectors.selectById(state, props.repo));
  const { commits, heads, update } = useGitHistory(repo);

  useEffect(() => { update() }, [props.repo]);

  useEffect(() => {
    if (reactFlowState && elements.length) {
      reactFlowState.fitView();
    }
  }, [elements, reactFlowState]);

  useEffect(() => {
    console.log('generating graph...');
    const asyncFetchGraph = async () => {
      setElements(repo ? await graphConstruction(commits, heads, repo) : []);
      // if (repo) await generateGraph(elements, commits, heads, repo);
    };
    asyncFetchGraph();
  }, [commits, heads, repo]);

  return (<ReactFlow
    elements={elements}
    nodeTypes={nodeTypes}
    onConnect={onConnect}
    onLoad={onLoad}
    // onNodeMouseEnter={(_event, node) => console.log(node.id)}
    className='git-flow' />);
}

export default GitGraph;