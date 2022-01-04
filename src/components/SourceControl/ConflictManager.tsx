import React, { useEffect } from 'react';
import { TreeView } from '@material-ui/lab';
import { Info, Warning } from '@material-ui/icons';
import type { Metafile, UUID } from '../../types';
import repoSelectors from '../../store/selectors/repos';
import { StyledTreeItem } from '../StyledTreeComponent';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { RootState } from '../../store/store';
import { loadCard } from '../../store/thunks/handlers';
import { extractFilename } from '../../containers/io';
import { ConflictRibbon } from './ConflictRibbon';
import metafileSelectors from '../../store/selectors/metafiles';
import { WithRequired } from '../../containers/format';
import useGitConflicts from '../../containers/hooks/useGitConflicts';

type ConflictManagerMetafile = WithRequired<Metafile, 'repo' | 'branch' | 'merging'>;

export const isConflictManagerMetafile = (metafile: Metafile): metafile is ConflictManagerMetafile => {
    return (metafile as ConflictManagerMetafile).handler === 'ConflictManager';
}

const ConflictManager: React.FunctionComponent<{ metafileId: UUID }> = props => {
    const metafile = useAppSelector((state: RootState) => metafileSelectors.selectById(state, props.metafileId));
    const repo = useAppSelector((state: RootState) => repoSelectors.selectById(state, metafile?.repo ? metafile.repo : ''));
    const { conflicts, update } = useGitConflicts(repo ? repo.root : '');
    const dispatch = useAppDispatch();

    useEffect(() => {
        console.log(`conflicts updated... [${conflicts.length}]`);
    }, [conflicts]);

    return (
        <div className='list-component'>
            {metafile && isConflictManagerMetafile(metafile) && <ConflictRibbon base={metafile.merging.base} compare={metafile.merging.compare} />}
            <TreeView>
                {conflicts.length == 0 &&
                    <StyledTreeItem key={'no-conflict'} nodeId={'no-conflict'}
                        color={'#da6473'} // red
                        labelText={'[no conflicts]'}
                        labelIcon={Info}
                        onClick={update}
                    />
                }
                {repo && metafile && isConflictManagerMetafile(metafile) && conflicts.length > 0 && conflicts.map(conflict =>
                    <StyledTreeItem key={`${repo.id}-${metafile.branch}-${conflict.filepath.toString()}`}
                        nodeId={`${repo.id}-${metafile.branch}-${conflict.filepath.toString()}`}
                        color={'#da6473'} // red
                        labelText={`${extractFilename(conflict.filepath)} [${conflict.conflicts?.length}]`}
                        labelIcon={Warning}
                        onClick={() => dispatch(loadCard({ filepath: conflict.filepath }))}
                    />
                )}
            </TreeView>
        </div>
    );
}

export default ConflictManager;