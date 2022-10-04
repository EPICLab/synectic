import React, { useEffect } from 'react';
import { InsertDriveFile as FileIcon, DeleteForever as Delete } from '@material-ui/icons';
import { remove as removePath } from 'fs-extra';
import { extractFilename } from '../../containers/io';
import { StyledTreeItem } from '../StyledTreeComponent';
import { useAppDispatch } from '../../store/hooks';
import { getRandomInt, isDefined, removeUndefinedProperties } from '../../containers/utils';
import { getSourceMotif } from '../../containers/motif';
import { FilebasedMetafile, isFilebasedMetafile, isFileMetafile } from '../../store/slices/metafiles';
import { isHydrated, updateFilebasedMetafile } from '../../store/thunks/metafiles';
import { buildCard } from '../../store/thunks/cards';
import { Skeleton } from '@material-ui/lab';


type FileType = {
    metafile: FilebasedMetafile;
}

const FileComponent = ({ metafile }: FileType) => {
    const motif = metafile && isFileMetafile(metafile) ? getSourceMotif(metafile) : undefined;
    const optionals = removeUndefinedProperties({ color: motif?.color });
    const skeletonWidth = metafile ? metafile.name.length * 15 : getRandomInt(55, 90);
    const dispatch = useAppDispatch();

    useEffect(() => {
        const asyncUpdates = async () => !isHydrated(metafile) ? await dispatch(updateFilebasedMetafile(metafile)) : undefined;
        asyncUpdates();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleClick = () => (metafile && metafile.status && ['*deleted', 'deleted'].includes(metafile.status)) ? null :
        (metafile && metafile.path && dispatch(buildCard({ path: metafile.path })));

    // expects a TreeView parent to encompass the StyledTreeItem below
    return (
        <>
            {isDefined(metafile) ?
                <StyledTreeItem key={metafile.id} nodeId={metafile.id}
                    labelText={extractFilename(metafile.path)}
                    {...optionals}
                    labelInfo={Delete}
                    labelInfoClickHandler={async (e) => {
                        e.stopPropagation(); // prevent propogating the click event to the StyleTreeItem onClick method
                        if (isFilebasedMetafile(metafile)) await removePath(metafile.path.toString());
                    }}
                    labelIcon={FileIcon}
                    enableHover={true}
                    onClick={handleClick} />
                : <Skeleton variant='text' aria-label='loading' width={skeletonWidth} />}
        </>
    );
};

export default FileComponent;