import { InsertDriveFile } from '@material-ui/icons';
import React from 'react';
import { add, restore } from '../../containers/git';
import { extractFilename } from '../../containers/io';
import { getSourceMotif, stagedCheck, unstagedCheck } from '../../containers/motif';
import { isDefined, removeUndefinedProperties } from '../../containers/utils';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import metafileSelectors from '../../store/selectors/metafiles';
import { isFilebasedMetafile, isFileMetafile } from '../../store/slices/metafiles';
import { RootState } from '../../store/store';
import { updateVersionedMetafile } from '../../store/thunks/metafiles';
import { UUID } from '../../store/types';
import { StyledTreeItem } from '../StyledTreeComponent';

const SourceFileComponent = (props: { metafileId: UUID }) => {
    const metafile = useAppSelector((root: RootState) => metafileSelectors.selectById(root, props.metafileId));
    const dispatch = useAppDispatch();
    const motif = isDefined(metafile) && isFileMetafile(metafile) ? getSourceMotif(metafile) : undefined;

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
        if (metafile && isFileMetafile(metafile)) {
            stagedCheck(metafile) ? await unstage() : unstagedCheck(metafile) ? await stage() : undefined;
        }
    }

    const optionals = removeUndefinedProperties({ color: motif?.color, labelInfo: motif?.icon });

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