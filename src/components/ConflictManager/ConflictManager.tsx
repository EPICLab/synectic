import React, { useEffect, useState } from 'react';
import { TreeView } from '@material-ui/lab';
import { Info, Warning } from '@material-ui/icons';
import metafileSelectors from '../../store/selectors/metafiles';
import repoSelectors from '../../store/selectors/repos';
import { StyledTreeItem } from '../StyledTreeComponent';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { RootState } from '../../store/store';
import { extractFilename, readFileAsync } from '../../containers/io';
import ConflictRibbon from '../ConflictRibbon';
import { WithRequired } from '../../containers/format';
import { PathLike } from 'fs-extra';
import { isFilebasedMetafile, Metafile, metafileUpdated } from '../../store/slices/metafiles';
import { UUID } from '../../store/types';
import { createCard } from '../../store/thunks/cards';

type ConflictManagerMetafile = WithRequired<Metafile, 'repo' | 'branch' | 'merging'>;

export const isConflictManagerMetafile = (metafile: Metafile): metafile is ConflictManagerMetafile => {
    return (metafile as ConflictManagerMetafile).handler === 'ConflictManager';
}

const ConflictManager = (props: { metafileId: UUID }) => {
    const metafile = useAppSelector((state: RootState) => metafileSelectors.selectById(state, props.metafileId));
    const repo = useAppSelector((state: RootState) => repoSelectors.selectById(state, metafile?.repo ? metafile.repo : ''));
    const conflictedMetafiles = useAppSelector((state: RootState) => metafileSelectors.selectByConflicted(state, repo ? repo.id : ''));
    const [filepath, setFilepath] = useState('');
    const metafiles = useAppSelector((state: RootState) => metafileSelectors.selectByFilepath(state, filepath));
    const dispatch = useAppDispatch();

    useEffect(() => {
        const asyncUpdate = async () => {
            await Promise.all(metafiles.map(async metafile => {
                const content = await readFileAsync(metafile.path, { encoding: 'utf-8' });
                dispatch(metafileUpdated({ ...metafile, content }));
                await dispatch(createCard({ path: metafile.path }));
            }));
        }
        asyncUpdate();
    }, [metafiles]);

    const handleClick = (filepath: PathLike) => setFilepath(filepath.toString());

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