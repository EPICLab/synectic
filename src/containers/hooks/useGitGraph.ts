import { diffArrays } from 'diff';
import { ReadCommitResult } from 'isomorphic-git';
import { useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import branchSelectors from '../../store/selectors/branches';
import metafileSelectors from '../../store/selectors/metafiles';
import repoSelectors from '../../store/selectors/repos';
import { Branch } from '../../store/slices/branches';
import { RootState } from '../../store/store';
import { UUID } from '../../store/types';
import { checkProject } from '../merges';
import { removeUndefined } from '../utils';
import { hasStatus } from '../git-porcelain';
import usePrevious from './usePrevious';

type Oid = string;
export type GitGraph = Map<Oid, CommitVertex>;
export type CommitVertex = ReadCommitResult & {
    scope: 'local' | 'remote',
    branch: string,
    parents: Oid[],
    children: Oid[],
    head: boolean,
    staged: boolean,
    conflicted: boolean
}
type useGitGraphHook = {
    /** A map from commit oid to CommitVertex elements contained within a graph. */
    graph: GitGraph,
    /** The ordered list of commit oids for the elements within the graph. */
    topological: Oid[],
    /** A convenience function for printing both the graph and the topologically-sorted graph of elements. */
    print: () => void
}

const useGitGraph = (repoId: UUID, pruned = false): useGitGraphHook => {
    const repo = useAppSelector((state: RootState) => repoSelectors.selectById(state, repoId));
    const staged = useAppSelector((state: RootState) => metafileSelectors.selectStagedFieldsByRepo(state, repo ? repo.id : ''));
    const prevStaged = usePrevious(staged);
    const branches = useAppSelector((state: RootState) => repo ? branchSelectors.selectByRepo(state, repo) : []);
    const prevBranches = usePrevious(branches);
    const [graph, setGraph] = useState(new Map<Oid, CommitVertex>());

    useEffect(() => {
        process('branches');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [branches]);

    useEffect(() => {
        const changed = prevStaged ? diffArrays(prevStaged, staged).filter(change => change.added || change.removed).length > 0 : true;
        if (changed) process('staged');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [staged]);

    const process = async (target: 'branches' | 'staged') => {
        if (repo) {
            const newGraph = new Map(graph);
            const { added, removed, modified } = (target === 'branches') ? partition() : { added: [], removed: [], modified: [] };

            if (removed) { // no guarantee about providence of commits, invalidate graph and reconstruct
                newGraph.clear();
                await Promise.all(branches.map(branch => parse(newGraph, branch)));
                await Promise.all(branches.map(branch => parseStaged(newGraph, branch)));
            } else {
                await Promise.all(added.map(branch => parse(newGraph, branch)));
                await Promise.all(modified.map(branch => parse(newGraph, branch)));
                await Promise.all(added.map(branch => parseStaged(newGraph, branch)));
                await Promise.all(modified.map(branch => parseStaged(newGraph, branch)));
            }
            if (target === 'staged') {
                await Promise.all(branches.map(branch => parseStaged(newGraph, branch)));
            }
            link(newGraph); // linking is needed for topological sorting to work properly
            if (pruned) prune(newGraph);
            setGraph(newGraph);
        }
    }

    /**
     * Parse all commits in a branch and record new commits in the graph map. Time complexity is `O(C)` when used on a single branch, 
     * where `C` is the number of commits. However, most of the time this will be used in conjunction with traversing through all branches 
     * in repository, in which case the complexity becomes `O(B*C)` where `B` is the number of branches (local and remote instances of a 
     * branch are considered separately).
     * @param graph The `Map` object containing a dictionary from SHA-1 commit hash to `CommitVertex` object.
     * @param branch A local or remote Branch object containing commits.
     */
    const parse = async (graph: GitGraph, branch: Branch) => {
        // check for conflicts in head commit
        const conflicted = (await checkProject(branch.root, branch.ref)).length > 0;

        branch.commits.map((commit, idx) => {
            !graph.has(commit.oid) ? graph.set(commit.oid, {
                ...commit,
                scope: branch.scope,
                branch: branch.ref,
                parents: commit.commit.parent,
                children: [],
                head: idx === 0 ? true : false,
                staged: false,
                conflicted: idx === 0 ? conflicted : false
            })
                : null
        });
    };

    const parseStaged = async (graph: GitGraph, branch: Branch) => {
        if (branch.scope === 'local') {
            const existing = graph.has(`${branch.scope}/${branch.ref}*`);
            const hasStaged = await hasStatus(branch.root, ['added', 'modified', 'deleted']);

            if (!existing && hasStaged) {
                // add placeholder CommitVertex for newly staged files in the branch
                graph.set(`${branch.scope}/${branch.ref}*`, {
                    oid: `${branch.scope}/${branch.ref}*`,
                    commit: {
                        message: '',
                        tree: '',
                        parent: branch.commits[0] ? [branch.commits[0].oid] : [],
                        author: { name: '', email: '', timestamp: 0, timezoneOffset: 0 },
                        committer: { name: '', email: '', timestamp: 0, timezoneOffset: 0 }
                    },
                    payload: '',
                    scope: branch.scope,
                    branch: branch.ref,
                    parents: branch.commits[0] ? [branch.commits[0].oid] : [],
                    children: [],
                    head: false,
                    staged: true,
                    conflicted: false
                });
            }
            if (existing && !hasStaged) {
                // delete any previously set placeholders CommitVertex
                graph.delete(`${branch.scope}/${branch.ref}*`);
            }
        }
    }

    /**
     * Traverse all vertices and add backlinks to all child vertices. Time complexity is `O(V+E)`, where `V` is
     * the number of vertices and `E` is the number of edges. 
     */
    const link = (graph: GitGraph) => {
        for (const vertex of graph.values()) {
            for (const oid of vertex.parents) {
                const parent = graph.get(oid);
                if (parent && !parent.children.some(child => child === vertex.oid)) {
                    graph.set(parent.oid, { ...parent, children: [...parent.children, vertex.oid] });
                }
            }
        }
    };

    /**
     * Filter for sequential vertices in the graph; i.e. commits with only a single parent and child. Traverses all
     * sequential vertices and relinks parent and child vertices to bypass the sequential vertex, and removes that 
     * sequential vertex from the graph. This breaks from the ground truth within git worktrees, but provides a 
     * minimum set of vertices for visualizing the repository graph. Time complexity is `O(V)`, where `V` is the number
     * of vertices (since `Map.get` and `Map.set` are `O(1)` constant operations).
     */
    const prune = (graph: GitGraph) => {
        const prunable = Array.from(graph.values()).filter(vertex => vertex.parents.length == 1 && vertex.children.length == 1);
        for (const vertex of prunable) {
            const sequential = graph.get(vertex.oid);                  // retrieve any vertex updates between for-loop iterations
            const parent = sequential ? graph.get(sequential.parents[0] as string) : undefined; // sequential type guarantees only 1 parent
            const child = sequential ? graph.get(sequential.children[0] as string) : undefined; // sequential type guarantees only 1 child

            if (sequential && parent && child) {
                child.parents = child.parents.map(p => p === sequential.oid ? parent.oid : p);
                parent.children = parent.children.map(c => c === sequential.oid ? child.oid : c);
                graph.set(parent.oid, parent);
                graph.set(child.oid, child);
                graph.delete(sequential.oid);
            }
        }
    };

    /**
     * Filter and partition commits in a branch into added, removed, and modified. Time complexity is `O(B*C)` where `B` is the
     * number of branches (local and remote instances are considered separately) and `C` is the number of commits in the repository.
     * @returns A filtered object containing branches that have been added, branches that have been removed, and branches that
     * contain modifications to the tracked commits, the commit pointed to by HEAD, or staged/unstaged files.
     */
    const partition = (): { added: Branch[], removed: boolean, modified: Branch[] } => {
        const removed = prevBranches ? prevBranches.some(branch => !branches.some(b => b.id === branch.id)) : false;
        if (removed) return { added: [], removed: removed, modified: [] }; // branches were removed, so invalidate the graph

        const isModified = (prev: Branch, curr: Branch) => {
            const sameHead = prev.head === curr.head;
            const sameCommits = !diffArrays(prev.commits, curr.commits, { comparator: (a, b) => a.oid === b.oid }).some(d => d.added || d.removed);
            return !(sameHead && sameCommits);
        }

        const isChanged = (branch: Branch) => {
            const prev = prevStaged?.some(m => m.branch === branch.id);
            const curr = staged.some(m => m.branch === branch.id);
            return prev !== curr;
        }

        const [added, modified] = branches.reduce((accumulator: [Branch[], Branch[]], branch) => {
            const prev = prevBranches?.find(b => b.id === branch.id);
            let modified = prev ? isModified(prev, branch) : true;
            modified = modified ? modified : isChanged(branch);
            return !prev ? (accumulator[0].push(branch), accumulator) : modified ? (accumulator[1].push(branch), accumulator) : accumulator;
        }, [[], []]);

        return { added: added, removed: removed, modified: modified };
    }

    const topologicalSortUtil = (key: string, visited: Map<string, boolean>, graph: GitGraph, stack: string[]) => {
        visited.set(key, true);
        const vertex = graph.get(key);
        if (vertex) {
            for (const v of vertex.children) {
                if (visited.get(v) === false) {
                    topologicalSortUtil(v, visited, graph, stack);
                }
            }
        }
        stack.push(key);
    }

    /**
     * Topological sorting for Directed Acyclic Graph (DAG) is a linear ordering of vertices such that for every directed edge `u -> v`, 
     * vertex `u` comes before `v` in the ordering. Topological Sorting for a graph is not possible if the graph is not a DAG.
     * @param graph The `Map` object containing a dictionary from SHA-1 commit hash to `CommitVertex` object.
     * @returns An array of keys corresponding to the elements in the graph, but sorted in topological order.
     */
    const topologicalSort = (graph: GitGraph) => {
        const visited: Map<string, boolean> = new Map([...graph.keys()].map(k => [k, false]));
        const stack: string[] = [];
        for (const key of graph.keys()) {
            if (visited.get(key) === false) {
                topologicalSortUtil(key, visited, graph, stack);
            }
        }
        return stack.reverse();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const topological = useMemo(() => topologicalSort(graph), [graph]);

    const print = () => {
        console.group(repo?.name);
        const topologicallySorted = removeUndefined(topological.map(oid => graph.get(oid)));
        console.log({ graph, topologicallySorted });
        console.groupEnd();
    }

    return { graph, topological, print };
}

export default useGitGraph;