import React, { useContext } from 'react';
import { Undo } from '@material-ui/icons';
import type { UUID } from '../../types';
import { readFileAsync } from '../../containers/io';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { addItemInArray, removeItemInArray } from '../../store/immutables';
import cardSelectors from '../../store/selectors/cards';
import metafileSelectors from '../../store/selectors/metafiles';
import { cardUpdated } from '../../store/slices/cards';
import { metafileUpdated } from '../../store/slices/metafiles';
import { RootState } from '../../store/store';
import { fetchVersionControl, isFileMetafile } from '../../store/thunks/metafiles';
import { Mode, useIconButtonStyle } from './useStyledIconButton';
import { FSCache } from '../../store/cache/FSCache';
import { IconButton, Tooltip } from '@material-ui/core';

type UndoButtonProps = {
    cardIds: UUID[],
    mode?: Mode
}

/**
 * Button for undoing changes back to the most recent version according to the filesystem for file-based cards. This button tracks the 
 * state of metafiles associated with the list of cards supplied via props. The button is only enabled when at least one associated 
 * metafile has content that is diverged from the cache (according to FSCache). Clicking on the button will trigger all modified metafiles 
 * to have their content reset to the content in the associated files. This button operates as the inverse operation to the `SaveButton`.
 * @param cardIds List of Card UUIDs that should be tracked by this button.
 * @param mode Optional mode for switching between light and dark themes.
 */
const UndoButton: React.FunctionComponent<UndoButtonProps> = ({ mode = 'light', cardIds }) => {
    const cards = useAppSelector((state: RootState) => cardSelectors.selectByIds(state, cardIds));
    const metafiles = useAppSelector((state: RootState) => metafileSelectors.selectByIds(state, cards.map(c => c.metafile)));
    const { cache } = useContext(FSCache);
    const modified = metafiles.filter(m => m.path && m.content !== cache.get(m.path));
    const dispatch = useAppDispatch();
    const classes = useIconButtonStyle({ mode: mode });

    const undo = async () => {
        await Promise.all(modified
            .filter(isFileMetafile)
            .map(async metafile => {
                const updatedContent = await readFileAsync(metafile.path, { encoding: 'utf-8' });
                const vcs = await dispatch(fetchVersionControl(metafile)).unwrap();
                dispatch(metafileUpdated({ ...metafile, ...vcs, state: 'unmodified', content: updatedContent }));
            })
        );

        offHover();
    }

    // check whether button is on a single card and also captured
    const isCaptured = cards.length == 1 && cards[0].captured !== undefined;
    // check whether button is on a content-based card that can be undone based on file-content
    const isUndoable = modified.length > 0 && modified[0].filetype !== 'Directory' && modified[0].handler === 'Editor';

    const onHover = () => {
        if (cards.length > 1) {
            cards.filter(c => modified.find(m => c.metafile === m.id) ? true : false)
                .map(c => dispatch(cardUpdated({ ...c, classes: addItemInArray(c.classes, 'selected') })));
        }
    }

    const offHover = () => {
        cards.map(c => dispatch(cardUpdated({ ...c, classes: removeItemInArray(c.classes, 'selected') })));
    }

    return (
        <>
            {isUndoable && !isCaptured &&
                <Tooltip title='Undo'>
                    <IconButton
                        className={classes.root}
                        aria-label='undo'
                        onClick={undo}
                        onMouseEnter={onHover}
                        onMouseLeave={offHover}
                    >
                        <Undo />
                    </IconButton>
                </Tooltip>}
        </>
    );

}

export default UndoButton;