import { IconButton, Tooltip } from '@material-ui/core';
import { Refresh } from '@material-ui/icons';
import React from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import metafileSelectors from '../../store/selectors/metafiles';
import { isFilebasedMetafile, isVersionedMetafile } from '../../store/slices/metafiles';
import { RootState } from '../../store/store';
import { updateFilebasedMetafile, updateVersionedMetafile } from '../../store/thunks/metafiles';
import { UUID } from '../../store/types';
import { Mode, useIconButtonStyle } from './useStyledIconButton';

/**
 * Button for refreshing filebased and versioned fields in metafiles.
 * 
 * @param props - Prop object for metafiles.
 * @param props.metafileIds - List of Metafile UUIDs that should be tracked by this button.
 * @param props.enabled - Optional flag for including logic that hides this button if false; defaults to true.
 * @param props.mode - Optional theme mode for switching between light and dark themes.
 * @returns {React.Component} A React function component.
 */
const RefreshButton = ({ metafileIds, enabled = true, mode = 'light' }: { metafileIds: UUID[], enabled?: boolean, mode?: Mode }) => {
    const metafiles = useAppSelector((state: RootState) => metafileSelectors.selectByIds(state, metafileIds));
    const dispatch = useAppDispatch();
    const classes = useIconButtonStyle({ mode: mode });

    const refresh = async (event: React.MouseEvent) => {
        event.stopPropagation(); // prevent propogating the click event to underlying components that might have click event handlers
        return await Promise.all(metafiles.map(async metafile => {
            if (metafile) {
                if (isFilebasedMetafile(metafile)) await dispatch(updateFilebasedMetafile(metafile));
                if (isVersionedMetafile(metafile)) await dispatch(updateVersionedMetafile(metafile));
            }
        }));
    }

    return enabled ? (
        <Tooltip title='Refresh'>
            <IconButton
                className={classes.root}
                aria-label='refresh'
                onClick={refresh}
            >
                <Refresh />
            </IconButton>
        </Tooltip>
    ) : null;
}

export default RefreshButton;