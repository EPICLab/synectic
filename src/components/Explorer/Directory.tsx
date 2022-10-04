import React, { useEffect, useState } from 'react';
import FolderIcon from '@material-ui/icons/Folder';
import FolderOpenIcon from '@material-ui/icons/FolderOpen';
import { Skeleton } from '@material-ui/lab';
import FileComponent from './FileComponent';
import { StyledTreeItem } from '../StyledTreeComponent';
import { useAppDispatch } from '../../store/hooks';
import { UUID } from '../../store/types';
import { getRandomInt, isDefined } from '../../containers/utils';
import { isHydrated, updateFilebasedMetafile } from '../../store/thunks/metafiles';
import { FilebasedMetafile } from '../../store/slices/metafiles';
import { isDescendant } from '../../containers/io';

type DirectoryType = {
    /** The UUID for the top-level `DirectoryMetafile` entry. */
    id: UUID;
    /** All relevant metafiles, including the top-level `DirectoryMetafile`. */
    metafiles: FilebasedMetafile[];
};

const Directory = ({ id, metafiles }: DirectoryType) => {
    const [expanded, toggle] = useState(false);
    const dispatch = useAppDispatch();

    const metafile = metafiles.find(child => child.id === id);
    const descendants = metafile ? metafiles.filter(child => isDescendant(metafile.path, child.path, true)) : [];
    const directories = descendants.filter(child => child.filetype === 'Directory' && child.name !== 'node_modules');
    const files = descendants.filter(child => child.filetype !== 'Directory').sort((a, b) => a.name.localeCompare(b.name));
    const skeletonWidth = metafile ? metafile.name.length * 15 : getRandomInt(55, 90);

    useEffect(() => {
        const asyncUpdates = async () => (metafile && !isHydrated(metafile)) ? await dispatch(updateFilebasedMetafile(metafile)) : undefined;
        asyncUpdates();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const clickHandle = async () => {
        if (!expanded && metafile && !isHydrated(metafile)) {
            await dispatch(updateFilebasedMetafile(metafile));
        }
        toggle(!expanded);
    }

    return (
        <>
            {isDefined(metafile) ?
                <StyledTreeItem key={id} nodeId={id}
                    labelText={metafile ? metafile.name : ''}
                    labelIcon={expanded ? FolderOpenIcon : FolderIcon}
                    onClick={clickHandle}
                >
                    {directories.map(dir => <Directory id={dir.id} metafiles={metafiles} />)}
                    {files.map(file => <FileComponent key={file.id} metafile={file} />)}
                </StyledTreeItem >
                : <Skeleton variant='text' aria-label='loading' width={skeletonWidth} />}
        </>
    );
}

export default Directory;