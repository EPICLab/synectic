import React, { useContext, useEffect, useState } from 'react';
import { InsertDriveFile as FileIcon, DeleteForever as Delete } from '@material-ui/icons';
import { remove as removePath } from 'fs-extra';
import type { UUID } from '../../types';
import metafileSelectors from '../../store/selectors/metafiles';
import { RootState } from '../../store/store';
import { FSCache } from '../Cache/FSCache';
import { loadCard } from '../../store/thunks/handlers';
import { extractFilename } from '../../containers/io';
import { StyledTreeItem } from '../StyledTreeComponent';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { removeUndefinedProperties } from '../../containers/format';
import { isFilebasedMetafile } from '../../store/thunks/metafiles';

export const FileComponent: React.FunctionComponent<{ metafileId: UUID, update: () => Promise<void> }> = props => {
    const metafile = useAppSelector((root: RootState) => metafileSelectors.selectById(root, props.metafileId));
    const dispatch = useAppDispatch();
    const { subscribe, unsubscribe } = useContext(FSCache);
    const [internalStatus, setInternalStatus] = useState({ conflicts: false, unstaged: false, staged: false });

    useEffect(() => { check() }, [metafile?.status]);
    useEffect(() => {
        metafile && isFilebasedMetafile(metafile) ? subscribe(metafile.path) : null;
        return () => { metafile && isFilebasedMetafile(metafile) ? unsubscribe(metafile.path) : null }
    }, []);

    const check = () => {
        if (metafile && metafile.status) {
            const conflicts = metafile.conflicts ? metafile.conflicts.length > 0 : false;
            const unstaged = ['*absent', '*added', '*undeleted', '*modified', '*deleted'].includes(metafile.status);
            const staged = ['added', 'modified', 'deleted'].includes(metafile.status);
            setInternalStatus({ conflicts: conflicts, unstaged: unstaged, staged: staged });
        }
    }

    const handleClick = () => (metafile && metafile.status && ['*deleted', 'deleted'].includes(metafile.status)) ? null :
        (metafile && metafile.path && dispatch(loadCard({ filepath: metafile.path })));

    const colorFilter = () => {
        if (internalStatus.conflicts) return '#da6473'; // red
        if (internalStatus.staged) return '#61aeee'; // blue
        if (internalStatus.unstaged) return '#d19a66'; // orange
        return undefined;
    };

    const optionals = removeUndefinedProperties({ color: colorFilter() });

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
