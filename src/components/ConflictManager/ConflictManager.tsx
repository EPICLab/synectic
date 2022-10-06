import React from 'react';
import { TreeView } from '@material-ui/lab';
import { Info, Warning } from '@material-ui/icons';
import metafileSelectors from '../../store/selectors/metafiles';
import repoSelectors from '../../store/selectors/repos';
import { StyledTreeItem } from '../StyledTreeComponent';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { RootState } from '../../store/store';
import { extractFilename } from '../../containers/io';
import ConflictRibbon from '../ConflictRibbon';
import { WithRequired } from '../../containers/utils';
import { PathLike } from 'fs-extra';
import { isFilebasedMetafile, Metafile } from '../../store/slices/metafiles';
import { UUID } from '../../store/types';
import { buildCard } from '../../store/thunks/cards';
import { fetchMetafile } from '../../store/thunks/metafiles';

type ConflictManagerMetafile = WithRequired<Metafile, 'repo' | 'branch' | 'merging'>;

export const isConflictManagerMetafile = (metafile: Metafile): metafile is ConflictManagerMetafile => {
    return (metafile as ConflictManagerMetafile).handler === 'ConflictManager';
}

const ConflictManager = (props: { metafileId: UUID }) => {
    const metafile = useAppSelector((state: RootState) => metafileSelectors.selectById(state, props.metafileId));
    const repo = useAppSelector((state: RootState) => repoSelectors.selectById(state, metafile?.repo ? metafile.repo : ''));
    const conflictedMetafiles = useAppSelector((state: RootState) => metafileSelectors.selectByConflicted(state, repo ? repo.id : ''));
    const dispatch = useAppDispatch();

    const handleClick = async (filepath: PathLike) => {
        const targetMetafile = await dispatch(fetchMetafile({ path: filepath, handlers: ['Editor', 'Explorer'] })).unwrap();
        await dispatch(buildCard({ metafile: targetMetafile }));
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
        </div>
    );
}

export default ConflictManager;