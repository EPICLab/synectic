import React, { useState } from 'react';
import { TreeView } from '@material-ui/lab';
import InfoIcon from '@material-ui/icons/Info';
import WarningIcon from '@material-ui/icons/Warning';
import type { UUID } from '../types';
import { StyledTreeItem } from './StyledTreeComponent';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { RootState } from '../store/store';
import { repoSelectors } from '../store/selectors/repos';
import { loadCard } from '../containers/handlers';
import { extractFilename } from '../containers/io';
import { metafileSelectors } from '../store/selectors/metafiles';
import useGitConflicts from '../containers/hooks/useGitConflicts';

const ConflictManager: React.FunctionComponent<{ rootId: UUID }> = props => {
    const metafile = useAppSelector((state: RootState) => metafileSelectors.selectById(state, props.rootId));
    const repos = useAppSelector((state: RootState) => repoSelectors.selectAll(state));
    const [repo] = useState(metafile ? repos.find(r => r.id === metafile.repo) : undefined);
    const { conflicts } = useGitConflicts(repo ? repo.root : '');
    const dispatch = useAppDispatch();

    return (
        <div className='list-component'>
            <TreeView>
                {conflicts.length == 0 &&
                    <StyledTreeItem key={'no-conflict'} nodeId={'no-conflict'}
                        color={'#da6473'} // red
                        labelText={'[no conflicts]'}
                        labelIcon={InfoIcon}
                    />
                }
                {conflicts.length > 0 && conflicts.map(conflict =>
                    <StyledTreeItem key={`${repo.id}-${metafile.branch}-${conflict.filepath}`}
                        nodeId={`${repo.id}-${metafile.branch}-${conflict.filepath}`}
                        color={'#da6473'} // red
                        labelText={`${extractFilename(conflict.filepath)} [${conflict.conflicts}]`}
                        labelIcon={WarningIcon}
                        onClick={() => dispatch(loadCard({ filepath: conflict.filepath }))}
                    />
                )}
            </TreeView>
        </div>
    );
}

export default ConflictManager;