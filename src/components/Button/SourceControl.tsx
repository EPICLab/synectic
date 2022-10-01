import React from 'react';
import { DeviceHub as VersionControl } from '@material-ui/icons';
import { IconButton, Tooltip } from '@material-ui/core';
import { RootState } from '../../store/store';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import metafileSelectors from '../../store/selectors/metafiles';
import repoSelectors from '../../store/selectors/repos';
import { Mode, useIconButtonStyle } from './useStyledIconButton';
import { getBranchRoot } from '../../containers/git';
import { removeUndefinedProperties } from '../../containers/utils';
import branchSelectors from '../../store/selectors/branches';
import { UUID } from '../../store/types';
import { buildCard } from '../../store/thunks/cards';
import { createMetafile } from '../../store/thunks/metafiles';

const SourceControlButton = ({ repoId, metafileId, mode = 'light' }: { repoId: UUID, metafileId: UUID, mode?: Mode }) => {
    const repo = useAppSelector((state: RootState) => repoSelectors.selectById(state, repoId));
    const metafile = useAppSelector((state: RootState) => metafileSelectors.selectById(state, metafileId));
    const branches = useAppSelector((state: RootState) => branchSelectors.selectEntities(state));
    const classes = useIconButtonStyle({ mode: mode });
    const dispatch = useAppDispatch();

    const loadSourceControl = async () => {
        if (!repo) {
            console.log(`Repository missing for metafile id:'${metafileId}'`);
            return;
        }
        if (!metafile || !metafile.branch) {
            console.log(`Cannot load source control for untracked metafile:'${metafileId}'`);
            return;
        }

        const branchName = branches[metafile.branch]?.ref;
        const optionals = branchName ? removeUndefinedProperties({ path: await getBranchRoot(repo.root, branchName) }) : {};
        const sourceControl = await dispatch(createMetafile({
            metafile: {
                name: 'Source Control',
                modified: 0,
                handler: 'SourceControl',
                filetype: '',
                loading: [],
                repo: repo.id,
                branch: metafile.branch,
                ...optionals
            }
        })).unwrap();

        dispatch(buildCard({ metafile: sourceControl }));
    };

    return (
        <>
            {repo && metafile &&
                <Tooltip title='Source Control'>
                    <IconButton className={classes.root} aria-label='source-control' onClick={loadSourceControl}>
                        <VersionControl />
                    </IconButton>
                </Tooltip>}
        </>
    );
};

export default SourceControlButton;