import React, { useEffect, useState } from 'react';
import ReactFlow, { addEdge, ArrowHeadType, Connection, Edge, FlowElement, Node } from 'react-flow-renderer';

import { Repository } from '../types';
import { nodeTypes } from './GitNode';
import { useGitHistory } from '../store/hooks/useGitHistory';
import { ReadCommitResult } from 'isomorphic-git';

export const GitGraph: React.FunctionComponent<{ repo: Repository }> = props => {
  const [elements, setElements] = useState<Array<FlowElement>>([]);
  const onConnect = (params: Edge | Connection) => setElements((els) => addEdge(params, els));
  const { commits, heads, update } = useGitHistory(props.repo);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { update() }, [props.repo]);

  useEffect(() => {
    if (commits.size > 0 && heads.size > 0) {
      console.log(`REPO => repo: ${props.repo.name}, commits: ${commits.size}`);
      console.log(JSON.stringify([...heads.entries()], null, 2));
    }
  }, [commits, heads, props.repo.name]);

  useEffect(() => {
    const newElements = [...commits.values()].reduce((prev: Array<FlowElement>, curr: ReadCommitResult, index): Array<FlowElement> => {
      const node: Node = {
        id: curr.oid,
        type: 'gitNode',
        data: { text: '', tooltip: `${curr.oid.slice(0, 7)}\n${curr.commit.message}` },
        position: { x: 380, y: (15 + (index * 105)) } // TODO: Layout is currently not spreading multiple child nodes into left, right, and center x-coordinate positions
      };
      const edges: Edge[] = curr.commit.parent.map(parent => {
        return {
          id: `e${parent.slice(0, 7)}-${curr.oid.slice(0, 7)}`,
          source: parent,
          target: curr.oid,
          arrowHeadType: ArrowHeadType.ArrowClosed
        };
      });
      return [node, ...prev, ...edges];
    }, []);
    setElements([...elements, ...newElements]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commits, heads]);

  return (<ReactFlow
    elements={elements}
    nodeTypes={nodeTypes}
    onConnect={onConnect}
    onNodeMouseEnter={(_event, node) => console.log(node.id)}
    className='git-flow' />);
}