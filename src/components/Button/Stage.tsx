import { IconButton, Tooltip } from '@material-ui/core';
import { Add } from '@material-ui/icons';
import React from 'react';
import { add } from '../../containers/git';
import { isModified, isUnmerged } from '../../containers/utils';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { addItemInArray, removeItemInArray } from '../../store/immutables';
import cardSelectors from '../../store/selectors/cards';
import metafileSelectors from '../../store/selectors/metafiles';
import { cardUpdated } from '../../store/slices/cards';
import { isFileMetafile, isVersionedMetafile, Metafile } from '../../store/slices/metafiles';
import { RootState } from '../../store/store';
import { updateVersionedMetafile } from '../../store/thunks/metafiles';
import { UUID } from '../../store/types';
import { Mode, useIconButtonStyle } from './useStyledIconButton';

/**
 * Button for managing the staging of changes for VCS-tracked cards. This button tracks the status of metafiles associated with the list
 * of cards supplied via props. The button is only enabled when at least one associated metafile has a VCS status of `*absent`, `*added`,
 * `*undeleted`, `*modified`, or `*deleted`. Clicking on the button will trigger all unstaged metafiles to have their changes staged.
 * 
 * @param props - Prop object for cards containing version tracked metafiles that can be staged.
 * @param props.cardIds - List of Card UUIDs that should be tracked by this button.
 * @param props.enabled - Optional flag for including logic that hides this button if false; defaults to true.
 * @param props.mode - Optional mode for switching between light and dark themes.
 * @returns {React.Component} A React function component.
 */
const StageButton = ({ cardIds, enabled = true, mode = 'light' }: { cardIds: UUID[], enabled?: boolean, mode?: Mode }) => {
    const cards = useAppSelector((state: RootState) => cardSelectors.selectByIds(state, cardIds));
    const metafiles = useAppSelector((state: RootState) => metafileSelectors.selectByIds(state, cards.map(c => c.metafile)));
    const unstaged = metafiles.filter(m => isVersionedMetafile(m) && (isModified(m.status) || isUnmerged(m.status)));
    const classes = useIconButtonStyle({ mode: mode });
    const dispatch = useAppDispatch();

    const isExplorer = metafiles.find(m => m.handler === 'Explorer') ? true : false;
    const hasUnstaged = unstaged.length > 0;
    const isCaptured = cards[0]?.captured !== undefined;

    const stage = async (event: React.MouseEvent) => {
        event.stopPropagation(); // prevent propogating the click event to underlying components that might have click event handlers
        await Promise.all(unstaged
            .filter(isFileMetafile)
            .map(async metafile => {
                await add(metafile.path);
                console.log(`staging ${metafile.name}`);
                dispatch(updateVersionedMetafile(metafile));
            })
        );
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

    return (enabled && !isExplorer && hasUnstaged && !isCaptured) ? (
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
        </Tooltip>
    ) : null;
}

export default StageButton;