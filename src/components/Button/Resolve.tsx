import { IconButton, Tooltip } from '@material-ui/core';
import { DoneAll, ExitToApp } from '@material-ui/icons';
import React, { useState } from 'react';
import { v4 } from 'uuid';
import { add, mergeInProgress } from '../../containers/git';
import { isModified } from '../../containers/utils';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import branchSelectors from '../../store/selectors/branches';
import cardSelectors from '../../store/selectors/cards';
import metafileSelectors from '../../store/selectors/metafiles';
import repoSelectors from '../../store/selectors/repos';
import { cardRemoved } from '../../store/slices/cards';
import { isFileMetafile, isVersionedMetafile } from '../../store/slices/metafiles';
import { modalAdded } from '../../store/slices/modals';
import { RootState } from '../../store/store';
import { updateVersionedMetafile } from '../../store/thunks/metafiles';
import { UUID } from '../../store/types';
import { isConflictManagerMetafile } from '../ConflictManager/ConflictManager';
import { Mode, useIconButtonStyle } from './useStyledIconButton';

/**
 * Button for staging resolution changes for all previously conflicting files in a repository, committing the resolution to the repository,
 * and cleaning up the merge conflict state within the repository afterwards.
 * 
 * @param props - Prop object for a card with unstaged merge conflict resolution changes.
 * @param props.cardId - Card UUID that should be tracked by this button.
 * @param props.mode - Optional mode setting for enabling the dark mode on this icon button.
 * @returns {React.Component} A React function component.
 */
const ResolveButton = ({ cardId, mode = 'light' }: { cardId: UUID, mode?: Mode }) => {
    const card = useAppSelector((state: RootState) => cardSelectors.selectById(state, cardId));
    const metafile = useAppSelector((state: RootState) => metafileSelectors.selectById(state, card?.metafile ? card.metafile : ''));
    const repo = useAppSelector((state: RootState) => repoSelectors.selectById(state, metafile?.repo ? metafile.repo : ''));
    const branches = useAppSelector((state: RootState) => branchSelectors.selectAll(state));
    const metafiles = useAppSelector((state: RootState) => metafileSelectors.selectByRepo(state, metafile?.repo ? metafile.repo : ''));
    const conflictedMetafiles = useAppSelector((state: RootState) => metafileSelectors.selectByConflicted(state, metafile?.repo ? metafile.repo : ''));
    const [isResolvable, setIsResolvable] = useState(false);
    const classes = useIconButtonStyle({ mode: mode });
    const dispatch = useAppDispatch();

    const unstaged = metafiles.filter(m => isVersionedMetafile(m) && isModified(m.status));
    const isCommitable = metafile && isConflictManagerMetafile(metafile) && conflictedMetafiles.length == 0;

    const stage = async () => await Promise.all(unstaged
        .filter(isFileMetafile)
        .map(async metafile => {
            await add(metafile.path);
            console.log(`staging ${metafile.name}`);
            dispatch(updateVersionedMetafile(metafile));
        })
    );

    const commitDialog = async () => {
        if (metafile && metafile.merging && repo) {
            const baseBranch = metafile.merging.base;
            const branch = branches.find(b => b.ref === baseBranch && b.scope === 'local');
            if (branch) {
                dispatch(modalAdded({
                    id: v4(),
                    type: 'CommitDialog',
                    options: {
                        'repo': repo.id,
                        'branch': branch.id
                    }
                }));
                setIsResolvable(true);
            }
        }
    };

    const resolve = async () => {
        if (metafile && metafile.merging) {
            if (repo) await mergeInProgress({ dir: repo.root, action: 'continue' });
            dispatch(cardRemoved(cardId));
        }
    }

    return (
        <>
            {isCommitable && !isResolvable && <Tooltip title='Commit Resolution'>
                <IconButton
                    className={classes.root}
                    aria-label='resolution'
                    onClick={async () => {
                        await stage();
                        await commitDialog();
                    }}
                >
                    <DoneAll />
                </IconButton>
            </Tooltip>}
            {isResolvable && <Tooltip title='Resolve Merge'>
                <IconButton
                    className={classes.root}
                    aria-label='resolve'
                    onClick={resolve}
                >
                    <ExitToApp />
                </IconButton>
            </Tooltip>}
        </>
    );
};

export default ResolveButton;