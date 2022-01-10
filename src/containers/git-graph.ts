import dagre from 'dagre';
import { ArrowHeadType, Edge, FlowElement, Node, isNode, isEdge } from 'react-flow-renderer';

import type { Repository } from '../types';
import { getStatus } from '../containers/git-porcelain';
import { CommitInfo } from './hooks/useGitHistory';
import { flattenArray } from '../containers/flatten';
import { colorSets } from '../containers/colors';

const nodesep = 80;

const getGitNode = (commit: CommitInfo, branchHead: string | undefined, parentNode?: Node): Node => {
  if (branchHead && branchHead === commit.oid) console.log(`branchHead: ${branchHead}, commit.oid: ${commit.oid}`);
  return ({
    id: commit.oid,
    type: 'gitNode',
    data: {
      text: '',
      tooltip: '',
      color: colorSets[5],
      border: '',
      // nodes need to keep track of their parents, so that we can know where the head of the branches are
      branch: branchHead && branchHead === commit.oid ? `${commit.scope}/${commit.branch}` : ''
    },
    position: parentNode ? { x: parentNode.position.x + nodesep, y: parentNode.position.y + nodesep } : { x: 0, y: 0 }
  });
};

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

const getGitStaged = async (commit: CommitInfo, repo: Repository, parentNode?: Node): Promise<(Node | Edge)[]> => {
  const currentBranchStatus = await getStatus(repo.root);
  if (currentBranchStatus && !(['ignored', 'unmodified'].includes(currentBranchStatus))) {
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
      position: parentNode ? { x: parentNode.position.x + nodesep, y: parentNode.position.y + nodesep } : { x: 0, y: 0 }
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
  graph.setGraph({ nodesep: nodesep });
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

const parseCommits = async (commits: CommitInfo[], heads: Map<string, string>, repo: Repository) => {
  const history = commits.reduce((prev: Array<FlowElement>, curr: CommitInfo): Array<FlowElement> => {
    const branchHead = heads.get(`${curr.scope}/${curr.branch}`);
    const node: Node = getGitNode(curr, branchHead);
    const edges: Edge[] = getGitEdge(curr);
    return [node, ...prev, ...edges];
  }, []);

  const headsHashes = Array.from(heads.values());
  const headCommits = commits.filter(commit => headsHashes.includes(commit.oid));
  const staged = flattenArray(await Promise.all(headCommits.map(currentBranchCommit => getGitStaged(currentBranchCommit, repo))));

  return { history, staged };
}

/**
 * 
 * @param baseGraph A copy of previously generated graphs to be updated, or an empty array for an initial graph.
 * @param commits A map of SHA-1 commit hashes to commits.
 * @param heads A map of scoped branch names to the SHA-1 hash of the commit pointed to by HEAD on that branch.
 * @param repo The Repository that contains local and remote branches linked to the `commits` and `heads` maps.
 */
export const generateGraph = async (
  baseGraph: Array<FlowElement>,
  commits: Map<string, CommitInfo>,
  heads: Map<string, string>,
  repo: Repository
): Promise<Array<FlowElement>> => {
  // const commitsArray = Array.from(commits.values());
  // const headsArray = Array.from(heads.values());

  const prevEdges = baseGraph.filter(isEdge);
  const prevHeadNodes = baseGraph.filter(isNode).filter(elem => !prevEdges.find(e => e.source === elem.id));
  // console.log(`commitsArray: ${JSON.stringify(commitsArray, undefined, 2)}`);

  // console.log(`prevEdges: ${JSON.stringify(prevEdges, undefined, 2)}`);
  // console.log(`prevHeads: ${JSON.stringify(prevHeadNodes, undefined, 2)}`);
  console.log(`commits [${commits.size}]: ${Array.from(commits.values()).length}`);
  console.log(`currHeads [${heads.size}]: ${JSON.stringify(Array.from(heads.entries()), undefined, 2)}`);
  console.log(`prevHeads [${prevHeadNodes.length}]: ${JSON.stringify(prevHeadNodes.map(n => [n.data.branch, n.id]), undefined, 2)}`);
  if (repo.id < '0') console.log('');
  if (baseGraph.length > 0) console.log('');
  // const newHeadCommits = commitsArray.filter(commit => headsArray.includes(commit.oid));

  // const prevStagedNodes = baseGraph.filter(isNode).filter(elem => elem.id.match(/^((?!-).)*\*$/gm));
  // const newCommits = Array.from(commits.values()).filter(commit => commit.oid === '3');

  return [];
}


export const graphConstruction = async (commits: Map<string, CommitInfo>, heads: Map<string, string>, repo: Repository)
  : Promise<Array<FlowElement>> => {
  const currentCommits = Array.from(commits.values())
    .sort((a, b) => a.commit.author.timestamp - b.commit.author.timestamp)  // sort by commit timestamp
    .slice(Math.max(commits.size - 80, 0))                                  // limited to 80 most recent commits

  const { history, staged } = await parseCommits(currentCommits, heads, repo);

  console.log(`graphConstruction =>`, { history, staged });

  const optimizedNewElements = layoutOptimizer([...history, ...staged]);
  return optimizedNewElements;
}

/**
 * Initial construction:
 *  (1) Gather all commits
 *  (2) Add nodes for every commit
 *  (2) Add edges between each related node
 *  (3) Gather branches with uncommitted changes
 *  (4) Add nodes for every branch with uncommitted changes
 *  (5) Add edges between each uncommitted node and the branch
 * Update construction:
 *  (1) Conver
 */

// export const graphUpdate = async (oldGraph: Array<FlowElement>, commits: Map<string, CommitInfo>, heads: Map<string, string>, repo: Repository)
//   : Promise<Array<FlowElement>> => {
//   const


//   const graphOids = oldGraph.map(els => els.id);
//   const newCommits = Array.from(commits.values()).filter(commit => !graphOids.includes(commit.oid));
//   const { history, staged } = parseCommits(newCommits, heads, repo);

//   const rfGraph: Array<FlowElement> = [...history, ...staged];

//   const graph = new dagre.graphlib.Graph();
//   graph.setGraph({ nodesep: 80 });
//   graph.setDefaultEdgeLabel(() => { return {}; });

//   rfGraph.filter(isNode).map(node => graph.setNode(node.id, { width: 5, height: 5 }));
//   rfGraph.filter(isEdge).map(edge => graph.setEdge(edge.source, edge.target));

//   const lastOriginalNode = 
//   const initialPosition = { x: oldGraph[-1]., y: 9 };
//   const updated: Array<FlowElement> = [];
//   for (let i = 0; i < rfGraph.length - 1; i++) {
//     updated.push({ ...rfGraph[i], });
//   }

//   return rfGraph.map(els => { ...els, position: { x: }
//     if (isNode(els)) {
//     const graphNode = graph.node(els.id);
//     return { ...els, position: { x: graphNode.x, y: graphNode.y } };
//   }
//   return els;
// });
// }