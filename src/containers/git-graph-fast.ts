import type { Branch } from '../types';
import { ReadCommitResult } from 'isomorphic-git';

type Vertex = ReadCommitResult & {
    parents: string[],
    children: string[],
    branching: boolean,
    merging: boolean,
    terminal: boolean,
    sequential: boolean,
    structural: boolean
}
type Graph = Map<string, Vertex>; // map from SHA1 commit hash to Vertex

export const build = (branches: Branch[]): Graph => {
    console.log('input', { branches });
    const graph: Graph = new Map();
    parse(graph, branches);
    console.log('parse', { graph });
    link(graph);
    console.log('link', { graph });
    prune(graph);
    console.log('prune', { graph });
    label(graph);
    console.log('label', { graph });
    return graph;
}

const parse = (graph: Graph, branches: Branch[]) => {
    for (const branch of branches) {
        for (const commit of branch.commits) {
            if (!graph.has(commit.oid)) {
                graph.set(commit.oid, {
                    ...commit,
                    parents: commit.commit.parent,
                    children: [],
                    branching: false,
                    merging: false,
                    terminal: false,
                    sequential: false,
                    structural: false
                });
            }
        }
    }
};

const link = (graph: Graph) => {
    for (const vertex of graph.values()) {
        for (const parent of vertex.parents) {
            graph.get(parent)?.children.push(vertex.oid);
        }
    }
};

const prune = (graph: Graph) => {
    const prunable = Array.from(graph.values()).filter(vertex => vertex.parents.length === 1 && vertex.children.length === 1);
    for (const target of prunable) {
        const sequential = graph.get(target.oid);                  // retrieve any vertex updates between for-loop iterations
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
}

const label = (graph: Graph) => {
    for (const vertex of graph.values()) {
        if (vertex.parents.length === 0 || vertex.children.length === 0) {
            vertex.terminal = true;
        }
        if (vertex.parents.length === 1 && vertex.children.length === 1) {
            vertex.sequential = true;
        }
        if (vertex.parents.length + vertex.children.length > 2) {
            vertex.structural = true;
        }
        if (vertex.children.length > 1) {
            vertex.branching = true;
        }
        if (vertex.parents.length > 1) {
            vertex.merging = true;
        }
        graph.set(vertex.oid, vertex);
    }
}

const topologicalSortUtil = (key: string, visited: Map<string, boolean>, graph: Graph, stack: string[]) => {
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

export const topologicalSort = (graph: Graph) => {
    const visited: Map<string, boolean> = new Map([...graph.keys()].map(k => [k, false]));
    const stack: string[] = [];

    for (const key of graph.keys()) {
        if (visited.get(key) === false) {
            topologicalSortUtil(key, visited, graph, stack);
        }
    }

    return stack.reverse();
}