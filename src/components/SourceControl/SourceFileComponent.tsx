import React from 'react';
import { InsertDriveFile } from '@material-ui/icons';
import { StyledTreeItem } from '../StyledTreeComponent';
import { extractFilename } from '../../containers/io';
import { removeUndefinedProperties } from '../../containers/format';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { RootState } from '../../store/store';
import metafileSelectors from '../../store/selectors/metafiles';
import { fetchVersionControl, isFilebasedMetafile, isFileMetafile } from '../../store/thunks/metafiles';
import { getSourceMotif, stagedCheck, unstagedCheck } from './SourceMotif';
import { add, remove } from '../../containers/git-plumbing';
import { metafileUpdated } from '../../store/slices/metafiles';
import { UUID } from '../../store/types';

const SourceFileComponent = (props: { metafileId: UUID }) => {
    const metafile = useAppSelector((root: RootState) => metafileSelectors.selectById(root, props.metafileId));
    const dispatch = useAppDispatch();
    const motif = metafile && isFileMetafile(metafile) ? getSourceMotif(metafile) : undefined;

    const stage = async () => {
        if (metafile && isFileMetafile(metafile)) {
            await add(metafile.path);
            const vcs = await dispatch(fetchVersionControl(metafile)).unwrap();
            dispatch(metafileUpdated({ ...metafile, ...vcs }));
        }
    };

    const unstage = async () => {
        if (metafile && isFileMetafile(metafile)) {
            await remove(metafile.path);
            const vcs = await dispatch(fetchVersionControl(metafile)).unwrap();
            dispatch(metafileUpdated({ ...metafile, ...vcs }));
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