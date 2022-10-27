import { IconButton, Tooltip } from '@material-ui/core';
import { Remove } from '@material-ui/icons';
import React from 'react';
import { restore } from '../../containers/git';
import { isStaged } from '../../containers/utils';
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
 * Button for managing the unstaging of changes for VCS-tracked cards. This button tracks the status of metafiles associated with the list
 * of cards supplied via props. The button is only enabled when at least one associated metafile has a VCS status of `added`, `modified`, 
 * or `deleted`. Clicking on the button will trigger all staged metafiles to have their changes unstaged.
 * 
 * @param props - Prop object for cards with staged changes according to VCS.
 * @param props.cardIds List of Card UUIDs that should be tracked by this button.
 * @param props.mode - Optional mode for switching between light and dark themes.
 * @returns {React.Component} A React function component.
 */
const UnstageButton = ({ cardIds, mode = 'light' }: { cardIds: UUID[], mode?: Mode }) => {
    const cards = useAppSelector((state: RootState) => cardSelectors.selectByIds(state, cardIds));
    const metafiles = useAppSelector((state: RootState) => metafileSelectors.selectByIds(state, cards.map(c => c.metafile)));
    const staged = metafiles.filter(m => isVersionedMetafile(m) && isStaged(m.status));
    const classes = useIconButtonStyle({ mode: mode });
    const dispatch = useAppDispatch();

    const isExplorer = metafiles.find(m => m.handler === 'Explorer');
    const hasStaged = staged.length > 0;
    const isCaptured = cards[0]?.captured !== undefined;

    const unstage = async () => await Promise.all(staged
        .filter(isFileMetafile)
        .map(async metafile => {
            await restore({ filepath: metafile.path, staged: true });
            console.log(`unstaging ${metafile.name}`);
            dispatch(updateVersionedMetafile(metafile));
        })
    );

    const onHover = (target: Metafile[]) => {
        if (cards.length > 1) {
            cards.filter(c => target.find(m => c.metafile === m.id) ? true : false)
                .map(c => dispatch(cardUpdated({ ...c, classes: addItemInArray(c.classes, 'selected-card') })));
        }
    }

    const offHover = () => {
        cards.map(c => dispatch(cardUpdated({ ...c, classes: removeItemInArray(c.classes, 'selected-card') })));
    }

    return (
        <>
            {!isExplorer && hasStaged && !isCaptured &&
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
        </>
    );
}

export default UnstageButton;