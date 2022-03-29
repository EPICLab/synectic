import React from 'react';
import { InsertDriveFile as FileIcon, DeleteForever as Delete } from '@material-ui/icons';
import { remove as removePath } from 'fs-extra';
import metafileSelectors from '../../store/selectors/metafiles';
import { RootState } from '../../store/store';
import { loadCard } from '../../store/thunks/filetypes';
import { extractFilename } from '../../containers/io';
import { StyledTreeItem } from '../StyledTreeComponent';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { removeUndefinedProperties } from '../../containers/format';
import { isFilebasedMetafile, isFileMetafile } from '../../store/thunks/metafiles';
import { getSourceMotif } from '../../containers/sourceMotif';
import { UUID } from '../../store/types';

const FileComponent = (props: { metafileId: UUID }) => {
    const metafile = useAppSelector((root: RootState) => metafileSelectors.selectById(root, props.metafileId));
    const dispatch = useAppDispatch();
    const motif = metafile && isFileMetafile(metafile) ? getSourceMotif(metafile) : undefined;

    const handleClick = () => (metafile && metafile.status && ['*deleted', 'deleted'].includes(metafile.status)) ? null :
        (metafile && metafile.path && dispatch(loadCard({ filepath: metafile.path })));

    const optionals = removeUndefinedProperties({ color: motif?.color });

    // expects a TreeView parent to encompass the StyledTreeItem below
    return (
        <>
            {metafile && metafile.path &&
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
            }
        </>
    );
};

export default FileComponent;