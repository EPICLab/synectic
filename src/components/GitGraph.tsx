import React, { useEffect, useState } from 'react';
import ReactFlow, { addEdge, ArrowHeadType, Connection, Edge, FlowElement, isNode, Node } from 'react-flow-renderer';

import type { Repository } from '../types';
import { nodeTypes } from './GitNode';
import { CommitInfo, useGitHistory } from '../store/hooks/useGitHistory';
import { layoutOptimizer } from '../containers/layout';
import { colorSets } from '../containers/colors';

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
    const newElements = [...commits.values()]
      .reduce((prev: Array<FlowElement>, curr: CommitInfo): Array<FlowElement> => {
        const node: Node = {
          id: curr.oid,
          type: 'gitNode',
          data: { text: '', color: colorSets[0], tooltip: `${curr.oid.slice(0, 7)}\n${curr.commit.message}` },
          position: { x: 0, y: 0 }
        };
        const edges: Edge[] = curr.commit.parent.map(parent => {
          return {
            id: `e${parent.slice(0, 7)}-${curr.oid.slice(0, 7)}`,
            source: parent,
            target: curr.oid,
            arrowHeadType: ArrowHeadType.ArrowClosed
          };
        });
        if (prev.filter(isNode).length > 50) return prev;
        else return [node, ...prev, ...edges];
      }, []);
    const optimizedNewElements = layoutOptimizer(newElements);
    setElements(optimizedNewElements);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commits, heads]);

  return (<ReactFlow
    elements={elements}
    nodeTypes={nodeTypes}
    onConnect={onConnect}
    onNodeMouseEnter={(_event, node) => console.log(node.id)}
    className='git-flow' />);
}