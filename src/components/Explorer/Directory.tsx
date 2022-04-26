import React, { useEffect, useState } from 'react';
import FolderIcon from '@material-ui/icons/Folder';
import FolderOpenIcon from '@material-ui/icons/FolderOpen';
import { Skeleton } from '@material-ui/lab';
import FileComponent from './FileComponent';
import { StyledTreeItem } from '../StyledTreeComponent';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import metafileSelectors from '../../store/selectors/metafiles';
import { RootState } from '../../store/store';
import { UUID } from '../../store/types';
import { isDefined } from '../../containers/format';
import { isHydrated, updateFilebasedMetafile } from '../../store/thunks/metafiles';
import { isFilebasedMetafile } from '../../store/slices/metafiles';

const Directory = (props: { metafile: UUID }) => {
    const metafile = useAppSelector((state: RootState) => metafileSelectors.selectById(state, props.metafile));
    const metafiles = useAppSelector((state: RootState) => metafileSelectors.selectByRoot(state,
        metafile && isFilebasedMetafile(metafile) ? metafile.path : ''));
    const directories = metafiles.filter(dir => dir.filetype === 'Directory' && !dir.name.startsWith('.')
        && dir.name !== 'node_modules' && dir.id !== metafile?.id);
    const files = metafiles.filter(file => file.filetype !== 'Directory').sort((a, b) => a.name.localeCompare(b.name));
    const loaded = isDefined(metafile) && isFilebasedMetafile(metafile) && isHydrated(metafile);
    const [expanded, setExpanded] = useState(false);
    const dispatch = useAppDispatch();

    useEffect(() => {
        const asyncUpdates = async () => (metafile && isFilebasedMetafile(metafile) && !isHydrated(metafile)) ? await dispatch(updateFilebasedMetafile(metafile)) : undefined;
        asyncUpdates();
    }, [metafile]);

    const clickHandle = async () => {
        if (!expanded && metafile && isFilebasedMetafile(metafile) && !isHydrated(metafile)) {
            await dispatch(updateFilebasedMetafile(metafile));
        }
        console.log({ files });
        setExpanded(!expanded);
    }

    // expects a TreeView parent to encompass the StyledTreeItem below
    return (
        <>
            {loaded ?
                <StyledTreeItem key={props.metafile} nodeId={props.metafile}
                    labelText={metafile ? metafile.name : ''}
                    labelIcon={expanded ? FolderOpenIcon : FolderIcon}
                    onClick={clickHandle}
                >
                    {directories.map(dir => <Directory key={dir.id} metafile={dir.id} />)}
                    {files.map(file => <FileComponent key={file.id} metafile={file.id} />)}
                </StyledTreeItem >
                : <Skeleton variant='text' aria-label='loading' />}
        </>
    );
};

export default Directory;