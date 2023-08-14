import { AccessTime, Source } from '@mui/icons-material';
import { List } from '@mui/material';
import { DateTime } from 'luxon';
import React from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import branchSelectors from '../../store/selectors/branches';
import metafileSelectors from '../../store/selectors/metafiles';
import repoSelectors from '../../store/selectors/repos';
import { Card, cardUpdated } from '../../store/slices/cards';
import { Action } from '../Card/ActionsMenu';
import { ReverseListItem, ReverseListMenu } from '../Card/ReverseItem';
import { GitBranch, GitRepo } from '../GitIcons';
import { modalAdded } from '../../store/slices/modals';
import { switchBranch } from '../../store/thunks/metafiles';
import { UUID } from '../../store/types';

const EditorReverse = (props: Card) => {
  const metafile = useAppSelector(state => metafileSelectors.selectById(state, props.metafile));
  const repo = useAppSelector(state => repoSelectors.selectById(state, metafile?.repo ?? ''));
  const branch = useAppSelector(state => branchSelectors.selectById(state, metafile?.branch ?? ''));
  const branches = useAppSelector(state =>
    branchSelectors.selectByIds(state, repo ? [...repo.local, ...repo.remote] : [])
  );
  const dispatch = useAppDispatch();

  const copyToClipboard = (text: string) => {
    window.api.clipboard.writeText(text);
    dispatch(
      modalAdded({
        id: window.api.uuid(),
        type: 'Notification',
        options: {
          message: `'${text}' copied to clipboard`
        }
      })
    );
  };

  const checkout = async (branch: UUID, ref: string) => {
    if (metafile?.branch === branch) {
      dispatch(
        modalAdded({
          id: window.api.uuid(),
          type: 'Notification',
          options: { message: `Card already set to branch '${ref}'` }
        })
      );
    }
    if (metafile && repo) {
      const updated = await dispatch(switchBranch({ id: metafile?.id, ref: ref })).unwrap();
      if (updated) {
        dispatch(
          cardUpdated({
            ...props,
            name: updated.name,
            modified: updated.modified,
            metafile: updated.id
          })
        );
      }
    } else {
      console.log(`checkout failed: ${ref}`, { metafile, repo });
    }
  };

  const actions: Action[] = branches.map(branch => ({
    icon: <GitBranch fontSize="small" />,
    name: `${branch.scope}/${branch.ref}`,
    onClick: () => checkout(branch.id, branch.ref)
  }));

  return (
    <>
      <List dense>
        <ReverseListItem
          icon={<AccessTime />}
          name={
            metafile
              ? DateTime.fromMillis(metafile.modified).toLocaleString(DateTime.DATETIME_SHORT)
              : ''
          }
          tooltip="Last Modified"
          onClick={() => null}
        />
        <ReverseListItem
          icon={<Source />}
          name={metafile?.path ?? ''}
          tooltip="Filepath"
          onClick={() => copyToClipboard(metafile?.path ?? '')}
        />
        <ReverseListItem
          icon={<GitRepo />}
          name={repo?.name ?? 'No Repository'}
          tooltip="Repository"
          onClick={async () => {
            window.api.openExternal(repo?.url ?? '');
          }}
        />
        <ReverseListMenu
          icon={<GitBranch />}
          name={branch?.ref ?? 'No Branch'}
          tooltip="Branch"
          actionPrompt="Switch to..."
          actions={actions}
        />
      </List>
    </>
  );
};

export default EditorReverse;
