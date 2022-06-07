import React, { useEffect } from 'react';
import { InsertDriveFile as FileIcon, DeleteForever as Delete } from '@material-ui/icons';
import { remove as removePath } from 'fs-extra';
import metafileSelectors from '../../store/selectors/metafiles';
import { RootState } from '../../store/store';
import { extractFilename } from '../../containers/io';
import { StyledTreeItem } from '../StyledTreeComponent';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { getRandomInt, isDefined, removeUndefinedProperties } from '../../containers/utils';
import { getSourceMotif } from '../../containers/sourceMotif';
import { UUID } from '../../store/types';
import { isFilebasedMetafile, isFileMetafile } from '../../store/slices/metafiles';
import { isHydrated, updateFilebasedMetafile } from '../../store/thunks/metafiles';
import { createCard } from '../../store/thunks/cards';
import { Skeleton } from '@material-ui/lab';

const FileComponent = (props: { metafile: UUID }) => {
    const metafile = useAppSelector((root: RootState) => metafileSelectors.selectById(root, props.metafile));
    const loaded = isDefined(metafile) && isFilebasedMetafile(metafile) && isHydrated(metafile);
    const motif = metafile && isFileMetafile(metafile) ? getSourceMotif(metafile) : undefined;
    const optionals = removeUndefinedProperties({ color: motif?.color });
    const skeletonWidth = metafile ? metafile.name.length * 15 : getRandomInt(55, 90);
    const dispatch = useAppDispatch();

    useEffect(() => {
        const asyncUpdate = async () => {
            if (metafile && isFilebasedMetafile(metafile) && !isHydrated(metafile))
                await dispatch(updateFilebasedMetafile(metafile));
        };
        asyncUpdate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [metafile]);

    const handleClick = () => (metafile && metafile.status && ['*deleted', 'deleted'].includes(metafile.status)) ? null :
        (metafile && metafile.path && dispatch(createCard({ path: metafile.path })));

    // expects a TreeView parent to encompass the StyledTreeItem below
    return (
        <>
            {loaded ?
                <StyledTreeItem key={metafile.id} nodeId={metafile.id}
                    labelText={extractFilename(metafile.path)}
                    {...optionals}
                    labelInfo={Delete}
                    labelInfoClickHandler={async (e) => {
                        e.stopPropagation(); // prevent propogating the click event to the StyleTreeItem onClick method
                        if (isFilebasedMetafile(metafile)) {
                            await removePath(metafile.path.toString());
                        }

                    }}
                    labelIcon={FileIcon}
                    enableHover={true}
                    onClick={handleClick} />
                : <Skeleton variant='text' aria-label='loading' width={skeletonWidth} />}
        </>
    );
};

export default FileComponent;