import dagre from 'dagre';
import { ArrowHeadType, Edge, FlowElement, Node, isNode, isEdge } from 'react-flow-renderer';

import type { Repository } from '../types';
import { currentBranch, getStatus } from '../containers/git';
import { CommitInfo } from '../store/hooks/useGitHistory';
import { flattenArray } from '../containers/flatten';
import { colorSets } from '../containers/colors';

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

export const layoutOptimizer = (rfGraph: Array<FlowElement>): Array<FlowElement> => {
  const graph = new dagre.graphlib.Graph();
  graph.setGraph({ nodesep: 80 });
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

export const graphConstruction = async (commits: Map<string, CommitInfo>, heads: Map<string, string>, repo: Repository)
  : Promise<Array<FlowElement>> => {
  const currentCommits = [...commits.values()]
    .sort((a, b) => a.commit.author.timestamp - b.commit.author.timestamp)  // sort by commit timestamp
    .slice(Math.max(commits.size - 80, 0))                                  // limited to 50 most recent commits
  const newElements = currentCommits.reduce((prev: Array<FlowElement>, curr: CommitInfo): Array<FlowElement> => {
    const branchHead = heads.get(`${curr.scope}/${curr.branch}`);
    const node: Node = getGitNode(curr, branchHead);
    const edges: Edge[] = getGitEdge(curr);
    return [node, ...prev, ...edges];
  }, []);
  const headsHashes = [...heads.values()];
  const headCommits = currentCommits.filter(commit => headsHashes.includes(commit.oid));
  // TODO: Until `git.getStatus` is able to handle worktrees, we will need to check through all open cards on the canvas
  // to determine if any contain changes compared to the latest version in the associated branch. The following line 
  // is an initial implementation that relies on this card-checking functionality:
  // const staged = flattenArray(await Promise.all(headCommits.map(headCommit => getGitStaged(headCommit, props.repo))));
  const currentBranchName = await currentBranch({ dir: repo.root.toString() });
  const currentBranchHash = heads.get(`local/${currentBranchName}`);
  const staged = flattenArray(await Promise.all(
    headCommits
      .filter(commit => commit.oid === currentBranchHash)
      .map(currentBranchCommit => getGitStaged(currentBranchCommit, repo))
  ));
  const optimizedNewElements = layoutOptimizer([...newElements, ...staged]);
  return optimizedNewElements;
}



