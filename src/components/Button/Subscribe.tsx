import { IconButton, Tooltip } from '@material-ui/core';
import { Speed } from '@material-ui/icons';
import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import metafileSelectors from '../../store/selectors/metafiles';
import { isFilebasedMetafile } from '../../store/slices/metafiles';
import { UUID } from '../../store/types';
import { Mode, useIconButtonStyle } from './useStyledIconButton';
import { subscribeCache, unsubscribeCache } from '../../store/thunks/cache';
import cardSelectors from '../../store/selectors/cards';

const SubscribeButton = ({ cardId, enabled = true, mode = 'light' }: { cardId: UUID, enabled?: boolean, mode?: Mode }) => {
    const card = useAppSelector(state => cardSelectors.selectById(state, cardId));
    const metafile = useAppSelector(state => metafileSelectors.selectById(state, card?.metafile ?? ''));
    const dispatch = useAppDispatch();
    const classes = useIconButtonStyle({ mode: mode });
    const [subscribed, toggleSubscribed] = useState(false);

    const subscribe = async (event: React.MouseEvent) => {
        event.stopPropagation(); // prevent propogating the click event to underlying components that might have click event handlers

        if (isFilebasedMetafile(metafile)) {
            if (!subscribed) {
                await dispatch(subscribeCache({ path: metafile.path, card: cardId }));
            } else {
                await dispatch(unsubscribeCache({ path: metafile?.path, card: cardId }));
            }
            toggleSubscribed(s => (s === false) ? true : false);
        }
    }

    return enabled ? (
        <Tooltip title={subscribed ? 'unsubscribe' : 'subscribe'}>
            <IconButton
                className={classes.root}
                aria-label='subscribe'
                onClick={subscribe}
            >
                <Speed />
            </IconButton>
        </Tooltip>
    ) : null;
}

export default SubscribeButton;