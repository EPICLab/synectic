import { InsertDriveFile } from '@material-ui/icons';
import React from 'react';
import { add, restore } from '../../containers/git';
import { extractFilename } from '../../containers/io';
import { isStaged, isModified, removeNullableProperties } from '../../containers/utils';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import metafileSelectors from '../../store/selectors/metafiles';
import { isFilebasedMetafile, isFileMetafile, isVersionedMetafile } from '../../store/slices/metafiles';
import { RootState } from '../../store/store';
import { updateVersionedMetafile } from '../../store/thunks/metafiles';
import { UUID } from '../../store/types';
import { StyledTreeItem } from '../StyledTreeComponent';
import { useFileMotif } from '../../containers/hooks/useMotif';

const SourceFileComponent = (props: { metafileId: UUID }) => {
    const metafile = useAppSelector((root: RootState) => metafileSelectors.selectById(root, props.metafileId));
    const motif = useFileMotif(metafile);
    const dispatch = useAppDispatch();

    const stage = async () => {
        if (metafile && isFileMetafile(metafile)) {
            await add(metafile.path);
            await dispatch(updateVersionedMetafile(metafile));
        }
    };

    const unstage = async () => {
        if (metafile && isFileMetafile(metafile)) {
            await restore({ filepath: metafile.path, staged: true });
            await dispatch(updateVersionedMetafile(metafile));
        }
    };

    const handleLabelClick = async () => {
        if (metafile && isVersionedMetafile(metafile)) {
            isStaged(metafile.status) ? await unstage() : isModified(metafile.status) ? await stage() : undefined;
        }
    }

    const optionals = removeNullableProperties({ color: motif?.color, labelInfo: motif?.icon });

    return (
        <>
            {metafile && isFilebasedMetafile(metafile) ?
                <StyledTreeItem key={metafile.path.toString()}
                    nodeId={metafile.path.toString()}
                    labelText={extractFilename(metafile.path)}
                    labelIcon={InsertDriveFile}
                    {...optionals}
                    enableHover={true}
                    labelInfoClickHandler={handleLabelClick} />
                : null
            }
        </>
    );
};

export default SourceFileComponent;