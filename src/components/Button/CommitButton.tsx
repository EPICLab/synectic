import React from 'react';
import { v4 } from 'uuid';
import { Add, Remove, Done } from '@material-ui/icons';
import { IconButton, Tooltip } from '@material-ui/core';
import type { Metafile, Modal, UUID } from '../../types';
import cardSelectors from '../../store/selectors/cards';
import metafileSelectors from '../../store/selectors/metafiles';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { RootState } from '../../store/store';
import { Mode, useIconButtonStyle } from './useStyledIconButton';
import { cardUpdated } from '../../store/slices/cards';
import { addItemInArray, removeItemInArray } from '../../store/immutables';
import { fetchVersionControl, isFileMetafile } from '../../store/thunks/metafiles';
import { add, remove } from '../../containers/git-plumbing';
import { metafileUpdated } from '../../store/slices/metafiles';
import { modalAdded } from '../../store/slices/modals';

/**
 * Button for managing the staging, unstaging, and initiation of commits for VCS-tracked cards. This button tracks the
 * status of metafiles associated with the list of cards supplied via props. The button is only enabled when at least one
 * associatedd metafile has a VCS status of `*absent`, `*added`, `*undeleted`, `*modified`, `*deleted`, `added`, `modified`, 
 * `deleted`. Clicking on the `Stage` button will trigger all unstaged metafiles to have their associated changed staged, clicking
 * on the `Unstage` button will reverse this process for any staged metafiles, and clicking on the `Commit` button will load
 * the staged metafiles into a new CommitDialog. 
 * @param cardIds List of Card UUIDs that should be tracked by this button.
 * @param mode Optional theme mode for switching between light and dark themes.
 * @returns 
 */
const CommitButton: React.FunctionComponent<{ cardIds: UUID[], mode?: Mode }> = ({ mode = 'light', cardIds }) => {
    const cards = useAppSelector((state: RootState) => cardSelectors.selectByIds(state, cardIds));
    const metafiles = useAppSelector((state: RootState) => metafileSelectors.selectByIds(state, cards.map(c => c.metafile)));
    const unstaged = metafiles
        .filter(m => m.status ? ['*absent', '*added', '*undeleted', '*modified', '*deleted'].includes(m.status) : false);
    const staged = metafiles
        .filter(m => m.status ? ['added', 'modified', 'deleted'].includes(m.status) : false);
    const dispatch = useAppDispatch();
    const classes = useIconButtonStyle({ mode: mode });

    const stage = async () => {
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

    const unstage = async () => {
        await Promise.all(staged
            .filter(isFileMetafile)
            .map(async metafile => {
                await remove(metafile.path);
                const vcs = await dispatch(fetchVersionControl(metafile)).unwrap();
                console.log(`unstaging ${metafile.name}`, { vcs });
                dispatch(metafileUpdated({ ...metafile, ...vcs }));

            })
        );
    };

    const commit = async () => {
        const firstMetafile = staged[0];
        if (firstMetafile.repo && firstMetafile.branch) {
            const commitDialogModal: Modal = {
                id: v4(),
                type: 'CommitDialog',
                options: {
                    'repo': firstMetafile.repo,
                    'branch': firstMetafile.branch
                }
            };
            dispatch(modalAdded(commitDialogModal));
        }
    };

    // checks for whether button is on a single card and also captured
    const isCaptured = cards.length == 1 && cards[0].captured !== undefined;

    const onHover = (target: Metafile[]) => {
        if (cards.length > 1) {
            cards.filter(c => target.find(m => c.metafile === m.id) ? true : false)
                .map(c => dispatch(cardUpdated({ ...c, classes: addItemInArray(c.classes, 'selected') })));
        }
    }

    const offHover = () => {
        cards.map(c => dispatch(cardUpdated({ ...c, classes: removeItemInArray(c.classes, 'selected') })));
    }

    return (
        <>
            {unstaged.length > 0 && !isCaptured &&
                <Tooltip title='Stage'>
                    <IconButton
                        className={classes.root}
                        aria-label='stage'
                        onClick={stage}
                        onMouseEnter={() => onHover(unstaged)}
                        onMouseLeave={offHover}
                    >
                        <Add />
                    </IconButton>
                </Tooltip>}
            {staged.length > 0 && !isCaptured &&
                <Tooltip title='Unstage'>
                    <IconButton
                        className={classes.root}
                        aria-label='unstage'
                        onClick={unstage}
                        onMouseEnter={() => onHover(staged)}
                        onMouseLeave={offHover}
                    >
                        <Remove />
                    </IconButton>
                </Tooltip>}
            {staged.length > 0 && !isCaptured &&
                <Tooltip title='Commit'>
                    <IconButton
                        className={classes.root}
                        aria-label='commit'
                        onClick={commit}
                        onMouseEnter={() => onHover(staged)}
                        onMouseLeave={offHover}
                    >
                        <Done />
                    </IconButton>
                </Tooltip>}
        </>
    );
}

export default CommitButton;