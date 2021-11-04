import React from 'react';
import { Button } from '@material-ui/core';
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


export const SourceControlButton: React.FunctionComponent<{ repoId: UUID; metafileId: UUID; }> = props => {
    const repo = useAppSelector((state: RootState) => repoSelectors.selectById(state, props.repoId));
    const metafile = useAppSelector((state: RootState) => metafileSelectors.selectById(state, props.metafileId));
    const dispatch = useAppDispatch();

    const loadSourceControl = async () => {
        if (!repo) {
            console.log(`Repository missing for metafile id:'${props.metafileId}'`);
            return;
        }
        if (!metafile || !metafile.branch) {
            console.log(`Cannot load source control for untracked metafile:'${props.metafileId}'`);
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

        console.log(`loading Source Control for: repo= ${repo.name}, branch= ${metafile.branch}\n${JSON.stringify(sourceControl)}`);
        console.log(`sourceControlMetafile:${JSON.stringify(sourceControl, undefined, 2)}`);
        dispatch(loadCard({ metafile: sourceControl }));
    };

    return (<Button onClick={loadSourceControl}>Source Control</Button>);
};
