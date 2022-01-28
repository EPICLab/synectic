import { diffArrays } from 'diff';
import { ReadCommitResult } from 'isomorphic-git';
import { useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import branchSelectors from '../../store/selectors/branches';
import repoSelectors from '../../store/selectors/repos';
import { RootState } from '../../store/store';
import type { Branch, UUID } from '../../types';
import usePrevious from './usePrevious';

type Oid = string;
export type GitGraph = Map<Oid, CommitVertex>;
export type CommitVertex = ReadCommitResult & {
    scope: 'local' | 'remote',
    branch: string,
    parents: Oid[],
    children: Oid[],
    head: boolean,
    staged: boolean
}
type useGitGraphHook = {
    graph: GitGraph,
    topological: Oid[],
    print: () => void
}

const useGitGraph = (repoId: UUID, pruned = false): useGitGraphHook => {
    const repo = useAppSelector((state: RootState) => repoSelectors.selectById(state, repoId));
    const branches = useAppSelector((state: RootState) => repo ? branchSelectors.selectByRepo(state, repo) : []);
    const previous = usePrevious(branches);
    const [graph, setGraph] = useState(new Map<Oid, CommitVertex>());

    useEffect(() => { process() }, [branches]);

    // const fetched = (branch.scope === 'remote')
    //     ? await log({ dir: repo.root.toString(), ref: `remotes/${branch.remote}/${branch.ref}` })
    //     : await log({ dir: repo.root.toString(), ref: branch.ref });

    const print = () => {
        console.group(repo?.name);
        console.log({ graph });
        console.groupEnd();
    }

    useEffect(() => { print() }, [graph]);

    const process = () => {
        if (repo) {
            const newGraph = new Map(graph);
            const { added, removed, modified } = partition();

            if (removed) { // no guarantee about providence of commits, invalidate graph and reconstruct
                newGraph.clear();
                branches.map(branch => parse(newGraph, branch));
            } else {
                added.map(branch => parse(newGraph, branch));
                modified.map(branch => parse(newGraph, branch));
            }
            if (pruned) {
                link(newGraph);
                prune(newGraph);
            }
            setGraph(newGraph);
        }
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

    const topological = useMemo(() => topologicalSort(graph), [graph]);

    /**
     * Filter and partition commits in a branch into added, removed, and modified. Time complexity is `O(B*C)` where `B` is the
     * number of branches (local and remote instances are considered separately) and `C` is the number of commits in the repository.
     * @returns A filtered object containing branches that have been added, branches that have been removed, and branches that
     * contain modifications to the tracked commits or the commit pointed to by HEAD.
     */
    const partition = (): { added: Branch[], removed: boolean, modified: Branch[] } => {
        const removed = previous ? previous.some(branch => !branches.some(b => b.id === branch.id)) : false;
        if (removed) return { added: [], removed: removed, modified: [] }; // removed branches invalidate the graph

        const isModified = (prev: Branch, curr: Branch) => {
            const sameHead = prev.head === curr.head;
            const sameCommits = diffArrays(prev.commits, curr.commits, { comparator: (a, b) => a.oid === b.oid }).length === 0;
            return !(sameHead && sameCommits);
        }

        const [added, modified] = branches.reduce((accumulator: [Branch[], Branch[]], branch) => {
            const prev = previous?.find(b => b.id === branch.id);
            const modified = prev ? isModified(prev, branch) : true;
            return !prev ? (accumulator[0].push(branch), accumulator) : modified ? (accumulator[1].push(branch), accumulator) : accumulator;
        }, [[], []]);

        return { added: added, removed: removed, modified: modified };
    }

    /**
     * Parse all commits in a branch and record new commits in the graph map. Time complexity is `O(C)` when used on a single branch, 
     * where `C` is the number of commits. However, most of the time this will be used in conjunction with traversing through all branches 
     * in repository, in which case the complexity becomes `O(B*C)` where `B` is the number of branches (local and remote instances of a 
     * branch are considered separately).
     * @param graph The `Map` object containing a dictionary from SHA-1 commit hash to `CommitVertex` object.
     * @param branch A local or remote Branch object containing commits.
     */
    const parse = (graph: GitGraph, branch: Branch) => {
        branch.commits.map((commit, idx) => {
            !graph.has(commit.oid) ? graph.set(commit.oid, {
                ...commit,
                scope: branch.scope,
                branch: branch.ref,
                parents: commit.commit.parent,
                children: [],
                head: idx === 0 ? true : false,
                staged: false
            })
            : null
        });
    };

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
            const parent = sequential ? graph.get(sequential.parents[0]) : undefined; // sequential type guarantees only 1 parent
            const child = sequential ? graph.get(sequential.children[0]) : undefined; // sequential type guarantees only 1 child

            if (sequential && parent && child) {
                child.parents = child.parents.map(p => p === sequential.oid ? parent.oid : p);
                parent.children = parent.children.map(c => c === sequential.oid ? child.oid : c);
                graph.set(parent.oid, parent);
                graph.set(child.oid, child);
                graph.delete(sequential.oid);
            }
        }
    };

    return { graph, topological, print };
}

export default useGitGraph;