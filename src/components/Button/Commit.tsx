import React from 'react';
import { v4 } from 'uuid';
import { IconButton, Tooltip } from '@material-ui/core';
import { Done } from '@material-ui/icons';
import cardSelectors from '../../store/selectors/cards';
import metafileSelectors from '../../store/selectors/metafiles';
import { Mode, useIconButtonStyle } from './useStyledIconButton';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { cardUpdated } from '../../store/slices/cards';
import { addItemInArray, removeItemInArray } from '../../store/immutables';
import { Modal, modalAdded } from '../../store/slices/modals';
import { UUID } from '../../store/types';
import { isVersionedMetafile, Metafile } from '../../store/slices/metafiles';
import { isStaged } from '../../containers/utils';

/**
 * Button for initiating commits to a specific branch and repository. This button tracks the status of metafiles associated 
 * with the list of cards supplied via props. The button is only enabled when at least one associated metafile has a VCS 
 * status of `added`, `modified`, or `deleted`. Clicking on the button will trigger a `CommitDialog` modal to be loaded.
 * 
 * @param props - Prop object for cards on a specific branch and repository.
 * @param props.cardIds - List of Card UUIDs that should be tracked by this button.
 * @param props.enabled - Optional flag for including logic that hides this button if false; defaults to true.
 * @param props.mode - Optional mode for switching between light and dark themes.
 * @returns {React.Component} A React function component.
 */
const CommitButton = ({ cardIds, enabled = true, mode = 'light' }: { cardIds: UUID[], enabled?: boolean, mode?: Mode }) => {
    const cards = useAppSelector(state => cardSelectors.selectByIds(state, cardIds));
    const metafiles = useAppSelector(state => metafileSelectors.selectByIds(state, cards.map(c => c.metafile)));
    const staged = metafiles.filter(m => isVersionedMetafile(m) && isStaged(m.status));
    const classes = useIconButtonStyle({ mode: mode });
    const dispatch = useAppDispatch();

    const hasStaged = staged.length > 0;
    const isCaptured = cards[0]?.captured !== undefined;

    const commit = async (event: React.MouseEvent) => {
        event.stopPropagation(); // prevent propogating the click event to underlying components that might have click event handlers
        const firstMetafile = staged[0];
        if (firstMetafile && firstMetafile.repo && firstMetafile.branch) {
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

    const onHover = (target: Metafile[]) => {
        if (cards.length > 1) {
            cards.filter(c => target.find(m => c.metafile === m.id) ? true : false)
                .map(c => dispatch(cardUpdated({ ...c, classes: addItemInArray(c.classes, 'selected-card') })));
        }
    }

    const offHover = () => {
        cards.map(c => dispatch(cardUpdated({ ...c, classes: removeItemInArray(c.classes, 'selected-card') })));
    }

    return (enabled && hasStaged && !isCaptured) ? (
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
        </Tooltip>
    ) : null;
}

export default CommitButton;