import { useCallback, useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import branchSelectors from '../../store/selectors/branches';
import { Branch, isUnmergedBranch } from '../../store/slices/branches';
import { Commit } from '../../store/slices/commits';
import { fetchCommit } from '../../store/thunks/commits';
import { Color, SHA1, UUID } from '../../store/types';
import { removeDuplicates, removeUndefined, symmetrical } from '../utils';
import useMap from './useMap';
import usePrevious from './usePrevious';

export type CommitVertex = Commit & {
  /** The Repository object UUID that contains branches and this commit in their history. */
  repo: UUID;
  /** Array of Branch object UUIDs that include this commit in their history. */
  branches: UUID[];
  /** Array of Branch object UUIDs that have HEAD pointed at this commit. */
  heads: UUID[];
  /** Array of Branch object UUIDs that have an incomplete merge (ie. conflict) at this commit. */
  conflicted: UUID[];
  /** Array of Commit object UUIDs that point back to this commit as their parent. */
  children: UUID[];
  /** Background color to display for this vertex node. */
  color: Color;
  /** Indicator for whether this vertex node represents a possible future git commit. */
  staged: boolean;
};
export type GitGraph = Map<SHA1, CommitVertex>;
export type BranchLookup = Map<string, SHA1>;

export type useGitGraphHook = {
  graph: GitGraph;
  topological: UUID[];
  branchLookup: BranchLookup;
  printGraph: () => void;
};

export const useGitGraph = (id: UUID): useGitGraphHook => {
  const graph = useMap<SHA1, CommitVertex>([]);
  const branchLookup = useMap<string, SHA1>([]);
  const [topological, setTopological] = useState<UUID[]>([]);
  const branches = useAppSelector(state => branchSelectors.selectByRepo(state, id, true));
  const previous = usePrevious(branches);
  const dispatch = useAppDispatch();

  const arrayAdd = <T>(arr: T[], addElem: T): T[] => {
    return removeDuplicates([...arr, addElem], (a, b) => a === b);
  };

  const arrayRemove = <T>(arr: T[], removeElem: T): T[] => {
    return arr.filter(e => e !== removeElem);
  };

  /**
   * Add or update a vertex in the graph. Multiple branches can reference the same commit, thus
   * this function adds a vertex if the commit was not previously part of the graph and adds
   * updated information to an existing vertex (including status changes, associated branches,
   * changes in head state, colors, etc.). This function is capable of discerning conflicts and
   * whether the vertex represents the head of any associated branches.
   */
  const updateVertex = useCallback(
    async <T extends Branch>(oid: SHA1, branch: T) => {
      const commit = await dispatch(
        fetchCommit({ commitIdentifiers: { oid: oid.toString(), root: branch.root } })
      ).unwrap();
      const existing = graph.get(oid);

      const updatedHeads =
        branch.head === oid
          ? arrayAdd(existing?.heads ?? [], branch.id)
          : arrayRemove(existing?.heads ?? [], branch.id);

      const updatedConflicted =
        branch.head === oid && branch.status === 'unmerged'
          ? arrayAdd(existing?.conflicted ?? [], branch.id)
          : arrayRemove(existing?.conflicted ?? [], branch.id);

      const update: CommitVertex = {
        ...(existing ?? commit),
        repo: id,
        branches: arrayAdd(existing?.branches ?? [], branch.id),
        heads: updatedHeads,
        conflicted: updatedConflicted,
        children: existing?.children ?? [],
        color:
          updatedConflicted.length > 0
            ? 'rgb(240, 128, 128)' // red
            : updatedHeads.length > 0
            ? 'rgb(143, 226, 0)' // green
            : 'rgb(128, 128, 128)', // grey
        staged: false
      };

      graph.set(oid, update);
      if (!existing) update.parents.forEach(async parent => await updateVertex(parent, branch));
    },
    [dispatch, graph, id]
  );

  /**
   * Add or update a placeholder vertex in the graph. Placeholders represent temporary states that
   * are not represented as commits within the underlying git repository (i.e. incomplete merges,
   * uncommitted changes, etc.). This function checks for uncommitted changes that have been staged
   * within the branch, and adds a staged placeholder vertex to represent the future commit that
   * encompasses these changes. This function also checks for incomplete merges within a branch,
   * and adds conflict placeholder vertices for each incomplete merge involving the specified
   * branch.
   */
  const updatePlaceholders = useCallback(
    async <T extends Branch>(branch: T) => {
      const prev = previous?.find(b => b.id === branch.id);
      const compare = isUnmergedBranch(branch)
        ? branches.find(b => b.scope === 'local' && b.ref === branch.merging)
        : undefined;

      // add a staged placeholder vertex
      if (branch.status === 'uncommitted') {
        const key = `${branch.scope}/${branch.ref}*`;

        graph.set(key, {
          oid: key,
          message: `Staged changes in ${branch.scope}/${branch.ref}`,
          parents: [branch.head],
          author: {
            name: '',
            email: '',
            timestamp: undefined
          },
          repo: id,
          branches: [branch.id],
          heads: [],
          children: [],
          color: 'rgb(97, 174, 238)', // blue
          staged: true,
          conflicted: []
        });
      } else {
        graph.delete(`${branch.scope}/${branch.ref}*`);
      }

      // add a conflict placeholder vertex
      if (isUnmergedBranch(branch) && compare) {
        const key = `${branch.scope}/${branch.ref}<>${branch.merging}`;
        const head = graph.get(branch.head);

        graph.set(key, {
          oid: key,
          message: `Incomplete merge from ${compare.scope}/${compare.ref} into ${branch.scope}/${branch.ref}`,
          parents: [branch.head, compare.head],
          author: {
            name: '',
            email: '',
            timestamp: undefined
          },
          repo: id,
          branches: [branch.id],
          heads: [branch.id],
          children: [],
          color: 'rgb(240, 128, 128)', // red
          staged: true,
          conflicted: [branch.id]
        });

        if (head)
          graph.set(head.oid, {
            ...head,
            color: 'rgb(240, 128, 128)', // red
            conflicted: [compare.id]
          });
      } else if (isUnmergedBranch(prev)) {
        const head = graph.get(prev.head);
        graph.delete(`${branch.scope}/${branch.ref}<>${prev.merging}`);

        if (head)
          graph.set(head.oid, {
            ...head,
            color: 'rgb(143, 226, 0)', // green
            conflicted: []
          });
      }
    },
    [branches, graph, id, previous]
  );

  /**
   * Remove or update a vertex in the graph. Multiple branches can reference the same commit, thus
   * this function only removes the vertex if removing association with a specified branch would
   * result in the vertex being associated with no branches. Otherwise, this function will update
   * the vertex to no longer include associations with the specified branch.
   */
  const removeVertex = useCallback(
    async <T extends Branch>(oid: SHA1, branch: T) => {
      const existing = graph.get(oid);
      const parents = existing ? removeUndefined(existing.parents.map(p => graph.get(p))) : [];

      parents.forEach(parent =>
        graph.set(parent.oid, {
          ...parent,
          children: parent.children.filter(c => c != oid)
        })
      );

      if (!existing || (existing.branches.includes(branch.id) && existing.branches.length === 1)) {
        graph.delete(oid);
      } else {
        graph.set(oid, {
          ...existing,
          branches: existing.branches.filter(b => b != branch.id),
          heads: existing.heads.filter(b => b != branch.id),
          conflicted: existing.conflicted.filter(b => b != branch.id)
        });
      }

      parents.forEach(async parent => await updateVertex(parent.oid, branch));
    },
    [graph, updateVertex]
  );

  /**
   * Traverse all vertices and add backlinks to all child vertices. Time complexity is `O(V+E)`,
   * where `V` is the number of vertices and `E` is the number of edges.
   */
  const link = useCallback(() => {
    for (const vertex of graph.values()) {
      for (const oid of vertex.parents) {
        const parent = graph.get(oid.toString());
        if (parent && !parent.children.some(child => child === vertex.oid)) {
          graph.set(parent.oid.toString(), {
            ...parent,
            children: [...parent.children, vertex.oid.toString()]
          });
        }
      }
    }
  }, [graph]);

  const topologicalSortUtil = useCallback(
    (key: SHA1, visited: Map<SHA1, boolean>, graph: GitGraph, stack: string[]) => {
      visited.set(key, true);
      const vertex = graph.get(key);
      if (vertex) {
        for (const v of vertex.children) {
          if (visited.get(v.toString()) === false) {
            topologicalSortUtil(v.toString(), visited, graph, stack);
          }
        }
      }
      stack.push(key.toString());
    },
    []
  );

  /**
   * Topological sorting for Directed Acyclic Graph (DAG) is a linear ordering of vertices such
   * that for every directed edge `u -> v`, vertex `u` comes before `v` in the ordering.
   * Topological Sorting for a graph is not possible if the graph is not a DAG.
   * @param graph The `Map` object containing a dictionary from SHA-1 commit hash to
   * `CommitVertex` object.
   * @returns {string[]} An array of keys corresponding to the elements in the graph, but sorted
   * in topological order.
   */
  const topologicalSort = useCallback(
    (graph: GitGraph) => {
      const visited: Map<SHA1, boolean> = new Map([...graph.keys()].map(k => [k, false]));
      const stack: string[] = [];
      for (const key of graph.keys()) {
        if (visited.get(key) === false) {
          topologicalSortUtil(key, visited, graph, stack);
        }
      }
      setTopological(stack.reverse());
    },
    [topologicalSortUtil]
  );

  const processChanges = useCallback(
    async (previous: Branch[] | undefined, branches: Branch[]) => {
      const { added, modified, removed } = changeFilter(previous, branches, [
        'id',
        'head',
        'status',
        'linked',
        'commits'
      ]);
      await Promise.all(
        added.map(async branch => {
          branch.commits.forEach(async oid => await updateVertex(oid.toString(), branch));
          await updatePlaceholders(branch);
          branchLookup.set(`${branch.scope}/${branch.ref}`, branch.head);
        })
      );
      await Promise.all(
        removed.map(async branch => {
          branch.commits.forEach(async oid => await removeVertex(oid.toString(), branch));
          await updatePlaceholders(branch);
          branchLookup.delete(`${branch.scope}/${branch.ref}`);
        })
      );
      await Promise.all(
        modified.map(async mod => {
          if (mod.changed.includes('commits')) {
            const [added, , removed] = symmetrical(
              mod.branch.commits,
              mod.prev.commits,
              (a, b) => a === b
            );
            added.forEach(async oid => await updateVertex(oid.toString(), mod.branch));
            removed.forEach(async oid => await removeVertex(oid.toString(), mod.branch));
            await updatePlaceholders(mod.branch);
          }
          if (
            !mod.changed.includes('commits') &&
            (mod.changed.includes('status') || mod.changed.includes('head'))
          ) {
            if (mod.branch.commits.includes(mod.prev.head))
              await updateVertex(mod.prev.head, mod.branch);
            await updatePlaceholders(mod.branch);
          }
          branchLookup.set(`${mod.branch.scope}/${mod.branch.ref}`, mod.branch.head);
        })
      );
      link();
      topologicalSort(graph);
    },
    [branchLookup, graph, link, removeVertex, topologicalSort, updatePlaceholders, updateVertex]
  );

  useEffect(() => {
    processChanges(previous, branches);
  }, [previous, branches, processChanges]);

  const printGraph = () => {
    console.groupCollapsed(
      `%c[useGitGraph] Print repo: ${id}`,
      'background: RebeccaPurple; color: white; padding: 3px; border-radius: 5px;'
    );
    console.log(`Graph:`, { graph, topological });
    console.log(`Branches:`, { prev: previous, branches });
    console.groupEnd();
  };

  return { graph, topological, branchLookup, printGraph };
};

const changeFilter = <BranchProps extends keyof Branch>(
  previous: Branch[] | undefined,
  branches: Branch[],
  props: BranchProps[]
): {
  added: Branch[];
  modified: { prev: Branch; branch: Branch; changed: BranchProps[] }[];
  removed: Branch[];
} => {
  const [added, existing, removed] = symmetrical(branches, previous ?? [], (a, b) => a.id === b.id);

  const modified = existing.reduce(
    (accum: { prev: Branch; branch: Branch; changed: BranchProps[] }[], [curr, prev]) => {
      const deltaProps = props.filter(prop => curr[prop] !== prev[prop]);
      if (deltaProps.length > 0) accum.push({ prev, branch: curr, changed: deltaProps });
      return accum;
    },
    []
  );

  return { added, modified, removed };
};
