import FolderIcon from '@material-ui/icons/Folder';
import FolderOpenIcon from '@material-ui/icons/FolderOpen';
import { Skeleton } from '@material-ui/lab';
import React, { useState } from 'react';
import { getRandomInt } from '../../containers/utils';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import metafileSelectors from '../../store/selectors/metafiles';
import { isDirectoryMetafile, isFilebasedMetafile } from '../../store/slices/metafiles';
import { updateFilebasedMetafile, updateVersionedMetafile } from '../../store/thunks/metafiles';
import { UUID } from '../../store/types';
import { StyledTreeItem } from '../StyledTreeComponent';
import FileComponent from './FileComponent';

const Directory = ({ metafileId: id }: { metafileId: UUID }) => {
    const metafile = useAppSelector(state => metafileSelectors.selectById(state, id));
    const { directories, files } = useAppSelector(state => metafileSelectors.selectDescendantsByRoot(state, metafile?.path ?? '', true));
    const skeletonWidth = metafile ? Math.min(metafile.name.length * 15, 245) : getRandomInt(55, 220);
    const [expanded, toggle] = useState(false);
    const dispatch = useAppDispatch();

    const clickHandle = async () => {
        // hydrate the Directory metafile before expanding
        if (!expanded && isDirectoryMetafile(metafile)) {
            const descendants = [...directories, ...files];
            await Promise.all(descendants.map(async desc => await dispatch(updateFilebasedMetafile(desc))));
            await Promise.all(descendants.map(async desc => await dispatch(updateVersionedMetafile(desc))));
        }
        toggle(!expanded);
    }

    return (
        <>
            {isFilebasedMetafile(metafile) && isDirectoryMetafile(metafile) ?
                <StyledTreeItem key={id} nodeId={id}
                    labelText={metafile ? metafile.name : ''}
                    labelIcon={expanded ? FolderOpenIcon : FolderIcon}
                    onClick={clickHandle}
                >
                    {directories.map(dir => <Directory key={dir.id} metafileId={dir.id} />)}
                    {files.map(file => <FileComponent key={file.id} metafileId={file.id} />)}
                </StyledTreeItem >
                : <Skeleton variant='text' aria-label='loading' width={skeletonWidth} />}
        </>
    );
};

export default Directory;