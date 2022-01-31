import React from 'react';
import { TreeView } from '@material-ui/lab';
import { Info, Warning } from '@material-ui/icons';
import type { Metafile, UUID } from '../../types';
import branchSelectors from '../../store/selectors/branches';
import metafileSelectors from '../../store/selectors/metafiles';
import repoSelectors from '../../store/selectors/repos';
import ResolveButton from '../Button/ResolveButton';
import { StyledTreeItem } from '../StyledTreeComponent';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { RootState } from '../../store/store';
import { loadCard } from '../../store/thunks/handlers';
import { extractFilename } from '../../containers/io';
import { ConflictRibbon } from './ConflictRibbon';
import { WithRequired } from '../../containers/format';
import { fetchContent, fetchMetafilesByFilepath, isFilebasedMetafile } from '../../store/thunks/metafiles';
import { PathLike } from 'fs-extra';
import { metafileUpdated } from '../../store/slices/metafiles';

type ConflictManagerMetafile = WithRequired<Metafile, 'repo' | 'branch' | 'merging'>;

export const isConflictManagerMetafile = (metafile: Metafile): metafile is ConflictManagerMetafile => {
    return (metafile as ConflictManagerMetafile).handler === 'ConflictManager';
}

const ConflictManager: React.FunctionComponent<{ metafileId: UUID }> = props => {
    const metafile = useAppSelector((state: RootState) => metafileSelectors.selectById(state, props.metafileId));
    const repo = useAppSelector((state: RootState) => repoSelectors.selectById(state, metafile?.repo ? metafile.repo : ''));
    const baseBranch = useAppSelector((state: RootState) => repo ? branchSelectors.selectByRepo(state, repo) : [])[0];
    const conflictedMetafiles = useAppSelector((state: RootState) => metafileSelectors.selectByConflicted(state, repo ? repo.id : ''));
    const dispatch = useAppDispatch();

    const handleClick = async (filepath: PathLike) => {
        // verify that most recent version of file content is available before loading card
        const metafiles = await dispatch(fetchMetafilesByFilepath(filepath)).unwrap();
        await Promise.all(metafiles.map(async metafile => {
            const content = await dispatch(fetchContent({ filepath: filepath })).unwrap();
            dispatch(metafileUpdated({ ...metafile, ...content }));
            await dispatch(loadCard({ filepath: metafile.path }));
        }));
    }

    return (
        <div className='list-component'>
            {metafile && isConflictManagerMetafile(metafile) && <ConflictRibbon base={metafile.merging.base} compare={metafile.merging.compare} />}
            <TreeView>
                {conflictedMetafiles.length == 0 &&
                    <StyledTreeItem key={'no-conflict'} nodeId={'no-conflict'}
                        color={'#da6473'} // red
                        labelText={'[no conflicts]'}
                        labelIcon={Info}
                    />
                }
                {repo && metafile && isConflictManagerMetafile(metafile) && conflictedMetafiles.length > 0 &&
                    conflictedMetafiles.filter(isFilebasedMetafile).map(conflict =>
                        <StyledTreeItem key={`${repo.id}-${metafile.branch}-${conflict.path.toString()}`}
                            nodeId={`${repo.id}-${metafile.branch}-${conflict.path.toString()}`}
                            color={'#da6473'} // red
                            labelText={`${extractFilename(conflict.path)} [${conflict.conflicts?.length}]`}
                            labelIcon={Warning}
                            onClick={() => handleClick(conflict.path)}
                        />
                    )}
            </TreeView>
            {repo && baseBranch && <ResolveButton repo={repo} branch={baseBranch} />}
        </div>
    );
}

export default ConflictManager;