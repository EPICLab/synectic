import {isDefined, uuid} from '#preload';
import {ListItemIcon, ListItemText, Menu, MenuItem, Tooltip} from '@mui/material';
import type {UUID} from '@syn-types/app';
import type {Branch} from '@syn-types/branch';
import type {Either} from '@syn-types/util';
import {GitAbort, GitBranch, GitCommit, GitDeleteBranch, GitMerge, GitRevert} from '../GitIcons';
import type {GitNodeProps} from './GitNode';
import {useAppDispatch, useAppSelector} from '/@/store/hooks';
import branchSelectors from '/@/store/selectors/branches';
import repoSelectors from '/@/store/selectors/repos';
import {modalAdded} from '/@/store/slices/modals';
import {addBranch, fetchBranch} from '/@/store/thunks/branches';
import {createCard} from '/@/store/thunks/cards';

export type Action = {
  icon: JSX.Element;
  name: string;
  tooltip?: string;
  disabled?: boolean;
  onClick: () => void;
};

const ContextMenu = ({
  anchorEl,
  open,
  onClose,
  node,
}: {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose:
    | ((event: Record<string, never>, reason: 'backdropClick' | 'escapeKeyDown') => void)
    | undefined;
  node: GitNodeProps;
}) => {
  const repo = useAppSelector(state => repoSelectors.selectById(state, node.data.repo));
  const branches = useAppSelector(state => branchSelectors.selectEntities(state));
  const repoBranches = useAppSelector(state => branchSelectors.selectByRepo(state, repo?.id ?? ''));
  const abortableBranches = repoBranches.filter(
    branch => branch.status === 'unmerged' && node.data.heads.includes(branch.id),
  );
  const dispatch = useAppDispatch();

  type BranchRef = Pick<Branch, 'ref' | 'scope'>;

  const checkout = async (input: Either<{id: UUID}, {branchRef: BranchRef}>) => {
    if (repo) {
      let branch = input.branchRef
        ? await dispatch(
            fetchBranch({
              branchIdentifiers: {
                root: repo.root,
                ref: input.branchRef.ref,
                scope: input.branchRef.scope,
              },
            }),
          ).unwrap()
        : branches[input.id];
      if (branch && !branch.linked && !branch.current) {
        branch = await dispatch(addBranch({root: branch.root, ref: branch.ref})).unwrap();
      }
      if (branch) await dispatch(createCard({path: branch.root}));
    }
    if (onClose) onClose({}, 'backdropClick');
  };

  const checkoutNewBranch = async () => {
    if (repo)
      dispatch(
        modalAdded({
          id: uuid(),
          type: 'NewBranchDialog',
          repo: repo.id,
          head: node.id,
        }),
      );
    if (onClose) onClose({}, 'backdropClick');
  };

  const deleteBranch = async (id: UUID) => {
    if (repo)
      dispatch(
        modalAdded({
          id: uuid(),
          type: 'DeleteBranchDialog',
          repo: repo.id,
          branch: id,
        }),
      );
    if (onClose) onClose({}, 'backdropClick');
  };

  const commit = (id: UUID) => {
    if (repo)
      dispatch(
        modalAdded({
          id: uuid(),
          type: 'CommitDialog',
          repo: repo.id,
          branch: id,
        }),
      );
    if (onClose) onClose({}, 'backdropClick');
  };

  const revert = (branch: UUID) => {
    if (repo)
      dispatch(
        modalAdded({
          id: uuid(),
          type: 'RevertCommitDialog',
          repo: repo.id,
          branch: branch,
          commit: node.id,
        }),
      );
    if (onClose) onClose({}, 'backdropClick');
  };

  const merge = async (input: Either<{id: UUID}, {branchRef: BranchRef}>) => {
    if (repo) {
      const branch = input.branchRef
        ? await dispatch(
            fetchBranch({
              branchIdentifiers: {
                root: repo.root,
                ref: input.branchRef.ref,
                scope: input.branchRef.scope,
              },
            }),
          ).unwrap()
        : branches[input.id];

      if (branch && branch.status !== 'unmerged') {
        dispatch(
          modalAdded({
            id: uuid(),
            type: 'MergeDialog',
            repo: repo.id,
            base: branch.id,
          }),
        );
      }
    }
    if (onClose) onClose({}, 'backdropClick');
  };

  const abort = (branch: Branch) => {
    if (repo) {
      console.log(`Abort merge of ${branch.scope}/${branch.ref}`);
      dispatch(
        modalAdded({
          id: uuid(),
          type: 'MergeDialog',
          repo: repo.id,
          base: branch.id,
          mode: 'abort',
        }),
      );
    }
    if (onClose) onClose({}, 'backdropClick');
  };

  const actions: Action[] = [
    ...node.data.parents
      .map(parent =>
        repoBranches.find(b => b.head === parent && `${b.scope}/${b.ref}*` === node.data.oid),
      )
      .filter(isDefined)
      .map(branch => ({
        icon: <GitBranch />,
        name: `Checkout ${branch.scope}/${branch.ref}`,
        disabled: !node.data.staged, // only show parents when staged
        onClick: () => checkout({id: branch.id}),
      })),
    ...node.data.heads.map(branch => ({
      icon: <GitBranch />,
      name: `Checkout ${branches[branch]?.scope}/${branches[branch]?.ref}`,
      disabled: node.data.staged, // only show when not staged
      onClick: () => checkout({id: branch}),
    })),
    {
      icon: <GitBranch />,
      name: `Checkout ${
        node.data.staged ? node.id : node.id.substring(0, 8) + '...'
      } [Detached HEAD]`,
      disabled: node.data.staged,
      onClick: () => checkout({branchRef: {ref: node.id, scope: 'local'}}),
    },
    {
      icon: <GitBranch />,
      name: `Create new branch at ${node.data.staged ? node.id : node.id.substring(0, 8) + '...'}`,
      disabled: node.data.staged,
      onClick: checkoutNewBranch,
    },
    ...node.data.heads.map(branch => ({
      icon: <GitDeleteBranch />,
      name: `Delete ${branches[branch]?.scope}/${branches[branch]?.ref}`,
      disabled: node.data.staged,
      onClick: () => deleteBranch(branch),
    })),
    {
      icon: <GitCommit />,
      name: `Commit to ${branches[node.data.branches[0] ?? '']?.scope}/${branches[
        node.data.branches[0] ?? ''
      ]?.ref}`,
      disabled: !node.data.staged,
      onClick: () => {
        commit(node.data.branches[0] ?? '');
      },
    },
    ...node.data.branches
      .filter(branch => !node.data.heads.includes(branch))
      .map(branch => ({
        icon: <GitRevert />,
        name: `Revert ${branches[branch]?.scope}/${branches[branch]?.ref} branch to ${
          node.data.staged ? node.id : node.id.substring(0, 8) + '...'
        }`,
        disabled: node.data.staged,
        onClick: () => revert(branch),
      })),
    ...node.data.heads.map(branch => ({
      icon: <GitMerge />,
      name: `Merge ${branches[branch]?.scope}/${branches[branch]?.ref}`,
      disabled: node.data.staged,
      onClick: () => merge({id: branch}),
    })),
    ...abortableBranches.map(branch => ({
      icon: <GitAbort />,
      name: `Abort merge on ${branch.scope}/${branch.ref}`,
      disabled: false,
      onClick: () => abort(branch),
    })),
  ].filter(action => action.disabled !== true);

  return open ? (
    <Menu
      id={`${node.data.oid}-context-menu`}
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      MenuListProps={{
        dense: true,
        'aria-labelledby': `${node.data.oid}-context-menu`,
      }}
    >
      {actions.map((action, index) => (
        <MenuItem
          key={index}
          onClick={action.onClick}
          disabled={action.disabled ?? false}
        >
          <ListItemIcon>{action.icon}</ListItemIcon>
          {action.tooltip ? (
            <Tooltip
              title={action.tooltip}
              placement="top-end"
            >
              <ListItemText>{action.name}</ListItemText>
            </Tooltip>
          ) : (
            <ListItemText>{action.name}</ListItemText>
          )}
        </MenuItem>
      ))}
    </Menu>
  ) : undefined;
};

export default ContextMenu;
