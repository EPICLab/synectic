import React from 'react';
import { IconButton, Tooltip } from '@material-ui/core';
import { Remove } from '@material-ui/icons';
import type { Metafile, UUID } from '../../types';
import cardSelectors from '../../store/selectors/cards';
import metafileSelectors from '../../store/selectors/metafiles';
import { remove } from '../../containers/git-plumbing';
import { metafileUpdated } from '../../store/slices/metafiles';
import { Mode, useIconButtonStyle } from './useStyledIconButton';
import { fetchVersionControl, isFileMetafile } from '../../store/thunks/metafiles';
import { RootState } from '../../store/store';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { cardUpdated } from '../../store/slices/cards';
import { addItemInArray, removeItemInArray } from '../../store/immutables';

type UnstageButtonProps = {
    cardIds: UUID[],
    mode?: Mode
}

/**
 * Button for managing the unstaging of changes for VCS-tracked cards. This button tracks the status of metafiles associated with the list
 * of cards supplied via props. The button is only enabled when at least one associated metafile has a VCS status of `added`, `modified`, 
 * or `deleted`. Clicking on the button will trigger all staged metafiles to have their changes unstaged.
 * @param cardIds List of Card UUIDs that should be tracked by this button.
 * @param mode Optional mode for switching between light and dark themes.
 */
const UnstageButton: React.FunctionComponent<UnstageButtonProps> = ({ mode = 'light', cardIds }) => {
    const cards = useAppSelector((state: RootState) => cardSelectors.selectByIds(state, cardIds));
    const metafiles = useAppSelector((state: RootState) => metafileSelectors.selectByIds(state, cards.map(c => c.metafile)));
    const staged = metafiles
        .filter(m => m.status ? ['added', 'modified', 'deleted'].includes(m.status) : false);
    const classes = useIconButtonStyle({ mode: mode });
    const dispatch = useAppDispatch();

    const isExplorer = metafiles.find(m => m.handler === 'Explorer');
    const hasStaged = staged.length > 0;
    const isCaptured = cards.length == 1 && cards[0].captured !== undefined;

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