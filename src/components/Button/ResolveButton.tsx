import React from 'react';
import { v4 } from 'uuid';
import { Done } from '@material-ui/icons';
import { IconButton, Tooltip } from '@material-ui/core';
import type { Branch, Repository } from '../../types';
import metafileSelectors from '../../store/selectors/metafiles';
import { add } from '../../containers/git-plumbing';
import { RootState } from '../../store/store';
import { metafileUpdated } from '../../store/slices/metafiles';
import { modalAdded } from '../../store/slices/modals';
import { Mode, useIconButtonStyle } from './useStyledIconButton';
import { fetchVersionControl, isFileMetafile } from '../../store/thunks/metafiles';
import { useAppDispatch, useAppSelector } from '../../store/hooks';

/**
 * Button for staging resolution changes for all previously conflicting files in a repository and loading a `ConflictDialog`
 * modal for initiating a resolution commit to the version control system. This button tracks the status of metafiles associated
 * with 
 * @param repo The Repository object.
 * @param branch The Branch object.
 * @param mode Optional mode setting for enabling the dark mode on this icon button.
 * @returns 
 */
const ResolveButton: React.FunctionComponent<{ repo: Repository, branch: Branch, mode?: Mode }> = ({ mode = 'light', repo, branch }) => {
    const metafiles = useAppSelector((state: RootState) => metafileSelectors.selectByRepo(state, repo.id));
    const conflictedMetafiles = useAppSelector((state: RootState) => metafileSelectors.selectByConflicted(state, repo.id));
    const classes = useIconButtonStyle({ mode: mode });
    const dispatch = useAppDispatch();

    const unstaged = metafiles
        .filter(m => m.status ? ['*absent', '*added', '*undeleted', '*modified', '*deleted'].includes(m.status) : false);
    const isResolvable = repo && branch && conflictedMetafiles.length == 0;

    const stage = async () => {
        console.log(`staging...`, { unstaged });
        await Promise.all(unstaged
            .filter(isFileMetafile)
            .map(async metafile => {
                await add(metafile.path);
                const vcs = await dispatch(fetchVersionControl(metafile)).unwrap();
                console.log(`staging ${metafile.name}`, { vcs });
                dispatch(metafileUpdated({ ...metafile, ...vcs }));
            })
        );
    };

    const commitDialog = async () => repo && branch ? dispatch(modalAdded({
        id: v4(),
        type: 'CommitDialog',
        options: {
            'repo': repo.id,
            'branch': branch.id
        }
    })) : null;

    return (
        <>
            {isResolvable && <Tooltip title='Resolve & Commit'>
                <IconButton
                    className={classes.root}
                    aria-label='resolve'
                    onClick={async () => {
                        await stage();
                        await commitDialog();
                    }}
                >
                    <Done />
                </IconButton>
            </Tooltip>}
        </>
    );
};

export default ResolveButton;