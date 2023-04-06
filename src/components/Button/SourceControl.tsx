import React from 'react';
import { DeviceHub as VersionControl } from '@material-ui/icons';
import { IconButton, Tooltip } from '@material-ui/core';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import metafileSelectors from '../../store/selectors/metafiles';
import repoSelectors from '../../store/selectors/repos';
import { Mode, useIconButtonStyle } from './useStyledIconButton';
import { getBranchRoot } from '../../containers/git';
import { isDefined, removeNullableProperties } from '../../containers/utils';
import branchSelectors from '../../store/selectors/branches';
import { UUID } from '../../store/types';
import { buildCard } from '../../store/thunks/cards';
import { createMetafile } from '../../store/thunks/metafiles';

type SourceControlProps = {
    repoId: UUID,
    metafileId: UUID,
    enabled?: boolean,
    mode?: Mode
}

/**
 * Button for opening a new `SourceControl` card tracking the repository associated with this button.
 * 
 * @param props - A destructured object for named props.
 * @param props.repoId - The Repository UUID that should be opened on click event.
 * @param props.metafileId - The Metafile UUID that should be tracked by this button.
 * @param props.enabled - Optional flag for including logic that hides this button if false; defaults to true.
 * @param props.mode - Optional mode for switching between light and dark themes.
 * @returns {React.Component} A React function component.
 */
const SourceControlButton = ({ repoId, metafileId, enabled = true, mode = 'light' }: SourceControlProps) => {
    const repo = useAppSelector(state => repoSelectors.selectById(state, repoId));
    const metafile = useAppSelector(state => metafileSelectors.selectById(state, metafileId));
    const branches = useAppSelector(state => branchSelectors.selectEntities(state));
    const classes = useIconButtonStyle({ mode: mode });
    const dispatch = useAppDispatch();

    const loadSourceControl = async (event: React.MouseEvent) => {
        event.stopPropagation(); // prevent propogating the click event to underlying components that might have click event handlers
        if (!repo) {
            console.log(`Repository missing for metafile id:'${metafileId}'`);
            return;
        }
        if (!metafile || !metafile.branch) {
            console.log(`Cannot load source control for untracked metafile:'${metafileId}'`);
            return;
        }

        const branchName = branches[metafile.branch]?.ref;
        const optionals = branchName ? removeNullableProperties({ path: await getBranchRoot(repo.root, branchName) }) : {};
        const sourceControl = await dispatch(createMetafile({
            metafile: {
                name: 'Source Control',
                modified: 0,
                handler: 'SourceControl',
                filetype: '',
                flags: [],
                repo: repo.id,
                branch: metafile.branch,
                ...optionals
            }
        })).unwrap();

        dispatch(buildCard({ metafile: sourceControl }));
    };

    return (enabled && isDefined(repo) && isDefined(metafile)) ? (
        <Tooltip title='Source Control'>
            <IconButton
                className={classes.root}
                aria-label='source-control'
                onClick={loadSourceControl}
            >
                <VersionControl />
            </IconButton>
        </Tooltip>
    ) : null;
};

export default SourceControlButton;