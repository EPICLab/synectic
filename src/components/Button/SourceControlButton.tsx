import React from 'react';
import { DeviceHub as VersionControl } from '@material-ui/icons';
import { IconButton, Tooltip } from '@material-ui/core';
import type { UUID } from '../../types';
import { RootState } from '../../store/store';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import metafileSelectors from '../../store/selectors/metafiles';
import repoSelectors from '../../store/selectors/repos';
import { loadCard } from '../../store/thunks/handlers';
import { fetchMetafile } from '../../store/thunks/metafiles';
import { v4 } from 'uuid';
import { DateTime } from 'luxon';
import { Mode, useIconButtonStyle } from './useStyledIconButton';
import { getBranchRoot } from '../../containers/git-path';
import { removeUndefinedProperties } from '../../containers/format';

type SourceControlButtonProps = {
    repoId: UUID,
    metafileId: UUID,
    mode?: Mode
}

const SourceControlButton: React.FunctionComponent<SourceControlButtonProps> = ({ mode = 'light', repoId, metafileId }) => {
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
        const optionals = removeUndefinedProperties({ path: await getBranchRoot(repo.root, metafile.branch) });
        const sourceControl = await dispatch(fetchMetafile({
            virtual: {
                id: v4(),
                modified: DateTime.local().valueOf(),
                name: 'Source Control',
                handler: 'SourceControl',
                repo: repo.id,
                branch: metafile.branch,
                ...optionals
            }
        })).unwrap();

        dispatch(loadCard({ metafile: sourceControl }));
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