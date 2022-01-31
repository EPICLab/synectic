import dagre from 'dagre';
import { ArrowHeadType, Edge, FlowElement, Node, isNode, isEdge } from 'react-flow-renderer';
import type { Branch, Repository } from '../types';
import { getStatus } from './git-porcelain';
import { CommitInfo } from './hooks/useGitHistory';
import { flattenArray } from './flatten';
import { colorSets } from './colors';
import { getBranchRoot } from './git-path';
import { checkProject } from './conflicts';
import { removeDuplicates } from './format';
// import { createAsyncThunk } from '@reduxjs/toolkit';
// import { fetchRepoBranches, fetchRepoById } from '../store/thunks/repos';
// import { AppThunkAPI } from '../store/hooks';
// import { fetchBranchById } from '../store/thunks/branches';

const nodesep = 80;

const getGitNode = (commit: CommitInfo, branchHead: string | undefined, conflict: boolean, parentNode?: Node): Node => {
  // if (branchHead && branchHead === commit.oid) console.log(`branchHead: ${branchHead}, commit.oid: ${commit.oid}`);
  return ({
    id: commit.oid,
    type: 'gitNode',
    data: {
      text: '',
      tooltip: '',
      color: (conflict && branchHead) ? colorSets[9] : colorSets[5],
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
  const branchRoot = await getBranchRoot(repo.root, commit.branch);
  const currentBranchStatus = branchRoot ? await getStatus(branchRoot) : undefined;
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

// const parseCommits = async (commits: CommitInfo[], heads: Map<string, string>, repo: Repository, conflicting: Branch[]) => {
const parseCommits = async (commits: CommitInfo[], heads: Omit<Map<string, string>, "set" | "clear" | "delete">, repo: Repository, conflicting: Branch[]) => {
  const history = commits.reduce((prev: Array<FlowElement>, curr: CommitInfo): Array<FlowElement> => {
    const branchHead = heads.get(`${curr.scope}/${curr.branch}`);
    const conflict = (branchHead && curr.scope === 'local' && conflicting.find(branch => branch.ref === curr.branch)) ? true : false;
    const node: Node = getGitNode(curr, branchHead, conflict);
    const edges: Edge[] = getGitEdge(curr);
    return [node, ...prev, ...edges];
  }, []);

  const headsHashes = Array.from(heads.values());
  const headCommits = commits.filter(commit => headsHashes.includes(commit.oid));
  const staged = flattenArray(await Promise.all(headCommits.filter(c => c.scope === 'local').map(currentBranchCommit => getGitStaged(currentBranchCommit, repo))));

  return { history, staged };
}

const generateGraphSegment = (branch: Branch, depth = 10): FlowElement[] => {
  const commits = [...branch.commits]                                       // use spread to make a copy before sorting (i.e. `Array.sort` uses an in-place mutable algorithm)
    .sort((a, b) => a.commit.author.timestamp - b.commit.author.timestamp)  // sort by commit timestamp
    .slice(Math.max(branch.commits.length - depth, 0))                      // limited to {depth} most recent commits

  const segment = commits.reduce((prev: FlowElement[], next: CommitInfo): FlowElement[] => {
    const node: Node = getGitNode(next, '', false);
    const edges: Edge[] = getGitEdge(next);
    return [node, ...prev, ...edges];
  }, []);

  return segment;
};

/**
 * 
 * @param baseGraph A copy of previously generated graphs to be updated, or an empty array for an initial graph.
 * @param commits A map of SHA-1 commit hashes to commits.
 * @param heads A map of scoped branch names to the SHA-1 hash of the commit pointed to by HEAD on that branch.
 * @param repo The Repository that contains local and remote branches linked to the `commits` and `heads` maps.
 */
export const generateGraph = async (branches: Branch[], defaultBranch: string, depth = 80, previousGraph?: FlowElement[]): Promise<FlowElement[]> => {
  const firstBranch = branches.find(branch => branch.ref === defaultBranch && branch.scope === 'local');
  const firstSegment = firstBranch ? generateGraphSegment(firstBranch) : [];

  const commits = removeDuplicates(flattenArray(branches.map(branch => branch.commits)), (a, b) => a.oid === b.oid);
  console.log('generateGraph => commits', { commits, defaultBranch, firstBranch, firstSegment, depth, previousGraph });

  // (1) start with the default branch, take 5 commits
  // (2) then take the head commit of every branch (can be up to 75 branches/commits)
  // (3) then remove Edge-Node-Edge connections that have only one parent and one child, replace with an Edge
  // (4) remaining number of commits should be evenly distributed between branches and pull in new commits
  // (5) repeat the pruning and expanding processes from (3) and (4)

  const optimizedNewElements = layoutOptimizer(firstSegment);
  return optimizedNewElements;
};

const conflictingBranches = (branches: Branch[]) => {
  return branches.filter(async branch => (await checkProject(branch.root)).length > 0);
};


// export const graphConstruction = async (commits: Map<string, CommitInfo>, heads: Map<string, string>, repo: Repository, branches: Branch[])
export const graphConstruction = async (commits: Omit<Map<string, CommitInfo>, "set" | "clear" | "delete">, heads: Omit<Map<string, string>, "set" | "clear" | "delete">, repo: Repository, branches: Branch[])
  : Promise<Array<FlowElement>> => {
  const currentCommits = Array.from(commits.values())
    .sort((a, b) => a.commit.author.timestamp - b.commit.author.timestamp)  // sort by commit timestamp
    .slice(Math.max(commits.size - 80, 0))                                  // limited to 80 most recent commits

  const conflicting = conflictingBranches(branches);
  // console.log({ branches, conflicting });
  const { history, staged } = await parseCommits(currentCommits, heads, repo, conflicting);

  // console.log(`graphConstruction =>`, { history, staged });

  const optimizedNewElements = layoutOptimizer([...history, ...staged]);
  return optimizedNewElements;
};