import React, { useEffect, useState } from 'react';
import ReactFlow, { addEdge, ArrowHeadType, Connection, Edge, FlowElement, Node, OnLoadFunc, OnLoadParams } from 'react-flow-renderer';

import type { Repository } from '../types';
import { nodeTypes } from './GitNode';
import { CommitInfo, useGitHistory } from '../store/hooks/useGitHistory';
import { layoutOptimizer } from '../containers/layout';
import { colorSets } from '../containers/colors';
import { currentBranch, getStatus } from '../containers/git';
import { flattenArray } from '../containers/flatten';

const getGitNode = (commit: CommitInfo, branchHead: string | undefined): Node => ({
  id: commit.oid,
  type: 'gitNode',
  data: {
    text: '',
    tooltip: '',
    color: colorSets[5],
    border: '',
    branch: branchHead && branchHead === commit.oid ? `${commit.scope}/${commit.branch}` : undefined
  },
  position: { x: 0, y: 0 }
});

const getGitEdge = (commit: CommitInfo): Edge[] => {
  return commit.commit.parent.map(parent => {
    return {
      id: `e${parent.slice(0, 7)}-${commit.oid.slice(0, 7)}`,
      source: parent,
      target: commit.oid,
      arrowHeadType: ArrowHeadType.ArrowClosed
    };
  });
};

const getGitStaged = async (commit: CommitInfo, repo: Repository): Promise<(Node | Edge)[]> => {
  const currentBranchStatus = await getStatus(repo.root);
  if (currentBranchStatus && !['ignored', 'unmodified'].includes(currentBranchStatus)) {
    return [{
      id: `${commit.oid}*`,
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
    },
    {
      id: `e${commit.oid.slice(0, 7)}-${commit.oid.slice(0, 7)}*`,
      source: commit.oid,
      target: `${commit.oid}*`,
      animated: true,
      arrowHeadType: ArrowHeadType.ArrowClosed
    }
    ];
  } else {
    return [];
  }
};

export const GitGraph: React.FunctionComponent<{ repo: Repository }> = props => {
  const [elements, setElements] = useState<Array<FlowElement>>([]);
  const [reactFlowState, setReactFlowState] = useState<OnLoadParams>();
  const onConnect = (params: Edge | Connection) => setElements((els) => addEdge(params, els));
  const { commits, heads, update } = useGitHistory(props.repo);
  const onLoad: OnLoadFunc = (rf) => { setReactFlowState(rf) };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { update() }, [props.repo]);

  useEffect(() => {
    if (reactFlowState && elements.length) {
      reactFlowState.fitView();
    }
  }, [elements, reactFlowState]);

  useEffect(() => {
    const asyncGraphConstruction = async () => {
      const currentCommits = [...commits.values()].slice(Math.max(commits.size - 50, 0)) // limited to 50 most recent commits
      const newElements = currentCommits.reduce((prev: Array<FlowElement>, curr: CommitInfo): Array<FlowElement> => {
        const branchHead = heads.get(`${curr.scope}/${curr.branch}`);
        const node: Node = getGitNode(curr, branchHead);
        const edges: Edge[] = getGitEdge(curr);
        return [node, ...prev, ...edges];
      }, []);
      const headsHashes = [...heads.values()];
      const headCommits = currentCommits.filter(commit => headsHashes.includes(commit.oid));
      // TODO: Until we have copied repositories that exist in a cache (probably in within .syn or .git directory), we will need to
      // check through all the open cards on the canvas to determine if any of them are associated with a branch and have changes
      // compared to the latest version in the branch. The following line has to wait until this is implemented:
      //
      // const staged = flattenArray(await Promise.all(headCommits.map(headCommit => getGitStaged(headCommit, props.repo))));
      const currentBranchName = await currentBranch({ dir: props.repo.root.toString() });
      const currentBranchHash = heads.get(`local/${currentBranchName}`);
      const staged = flattenArray(await Promise.all(headCommits
        .filter(commit => commit.oid === currentBranchHash)
        .map(currentBranchCommit => getGitStaged(currentBranchCommit, props.repo))));
      const optimizedNewElements = layoutOptimizer([...newElements, ...staged]);
      setElements(optimizedNewElements);
    }
    asyncGraphConstruction();
  }, [commits, heads, props.repo]);

  return (<ReactFlow
    elements={elements}
    nodeTypes={nodeTypes}
    onConnect={onConnect}
    onLoad={onLoad}
    onNodeMouseEnter={(_event, node) => console.log(node.id)}
    className='git-flow' />);
}