import React, { useEffect, useState } from 'react';
import { TreeView } from '@material-ui/lab';
import InfoIcon from '@material-ui/icons/Info';
import WarningIcon from '@material-ui/icons/Warning';
import type { Metafile } from '../../types';
import { StyledTreeItem } from '../StyledTreeComponent';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { RootState } from '../../store/store';
import repoSelectors from '../../store/selectors/repos';
import { loadCard } from '../../store/thunks/handlers';
import { extractFilename } from '../../containers/io';
import useGitConflicts from '../../containers/hooks/useGitConflicts';

const ConflictManager: React.FunctionComponent<{ root: Metafile }> = props => {
    const repos = useAppSelector((state: RootState) => repoSelectors.selectAll(state));
    const [repo] = useState(repos.find(r => r.id === props.root.repo));
    const { conflicts } = useGitConflicts(repo ? repo.root : '');
    const dispatch = useAppDispatch();

    useEffect(() => {
        console.log(`repo: ${repo ? repo.name : '[repo is missing]'}, conflicts: ${JSON.stringify(conflicts)}`);
    }, []);

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
                {repo && conflicts.length > 0 && conflicts.map(conflict =>
                    <StyledTreeItem key={`${repo.id}-${props.root.branch}-${conflict.filepath}`}
                        nodeId={`${repo.id}-${props.root.branch}-${conflict.filepath}`}
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