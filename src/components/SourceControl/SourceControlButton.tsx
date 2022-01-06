import React from 'react';
import { DeviceHub as VersionControl } from '@material-ui/icons';
import { IconButton, Tooltip } from '@material-ui/core';
import { UUID } from '../../types';
import { RootState } from '../../store/store';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import metafileSelectors from '../../store/selectors/metafiles';
import repoSelectors from '../../store/selectors/repos';
import { getBranchRoot } from '../../containers/git-porcelain';
import { loadCard } from '../../store/thunks/handlers';
import { fetchMetafile } from '../../store/thunks/metafiles';
import { v4 } from 'uuid';
import { DateTime } from 'luxon';
import { Mode, useIconButtonStyle } from '../StyledIconButton';


export const SourceControlButton: React.FunctionComponent<{ repoId: UUID, metafileId: UUID, mode?: Mode }> = ({ mode = 'light', repoId, metafileId }) => {
    const repo = useAppSelector((state: RootState) => repoSelectors.selectById(state, repoId));
    const metafile = useAppSelector((state: RootState) => metafileSelectors.selectById(state, metafileId));
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
        const branchRoot = await getBranchRoot(repo, metafile.branch);
        const sourceControl = await dispatch(fetchMetafile({
            virtual: {
                id: v4(),
                modified: DateTime.local().valueOf(),
                name: 'Source Control',
                handler: 'SourceControl',
                repo: repo.id,
                branch: metafile.branch,
                path: branchRoot ? branchRoot : ''
            }
        })).unwrap();

        dispatch(loadCard({ metafile: sourceControl }));
    };

    return (
        <>
            {repo && metafile &&
                <Tooltip title='Source Control'>
                    <IconButton
                        className={classes.root}
                        aria-label='source-control'
                        onClick={loadSourceControl}
                    >
                        <VersionControl />
                    </IconButton>
                </Tooltip>}
        </>
    );
};
