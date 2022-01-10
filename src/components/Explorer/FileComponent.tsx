import React, { useContext } from 'react';
import { InsertDriveFile as FileIcon, DeleteForever as Delete } from '@material-ui/icons';
import { remove as removePath } from 'fs-extra';
import type { GitStatus } from '../../types';
import { loadCard } from '../../store/thunks/handlers';
import { extractFilename } from '../../containers/io';
import { StyledTreeItem } from '../StyledTreeComponent';
import { useAppDispatch } from '../../store/hooks';
import { removeUndefinedProperties } from '../../containers/format';
import { FileMetafile, isFilebasedMetafile } from '../../store/thunks/metafiles';
import { FSCache } from '../Cache/FSCache';

export const FileComponent: React.FunctionComponent<FileMetafile & { update: () => Promise<void> }> = props => {
    const dispatch = useAppDispatch();
    const { unsubscribe } = useContext(FSCache);

    const modifiedCheck = (status: GitStatus | undefined): boolean => {
        if (!status) return false;
        return !['absent', 'unmodified', 'ignored'].includes(status);
    };

    const changedCheck = (status: GitStatus | undefined): boolean => {
        if (!status) return false;
        return ['*absent', '*added', '*undeleted', '*modified', '*deleted'].includes(status);
    };

    const stagedCheck = (status: GitStatus | undefined): boolean => {
        if (!status) return false;
        return modifiedCheck(status) && !changedCheck(status);
    };

    const colorFilter = (status: GitStatus | undefined, conflicts: number[] | undefined) => {
        if (conflicts && conflicts.length > 0) return '#da6473'; // red
        if (status && stagedCheck(status)) return '#61aeee';
        if (status && changedCheck(status)) return '#d19a66';
        return undefined;
    };

    const optionals = removeUndefinedProperties({ color: colorFilter(props.status, props.conflicts) });

    // expects a TreeView parent to encompass the StyledTreeItem below
    return (
        <StyledTreeItem key={props.id} nodeId={props.id}
            labelText={extractFilename(props.path)}
            {...optionals}
            labelInfo={Delete}
            labelInfoClickHandler={async (e) => {
                e.stopPropagation(); // prevent propogating the click event to the StyleTreeItem onClick method
                if (isFilebasedMetafile(props)) {
                    await unsubscribe(props.path);
                    await removePath(props.path.toString());
                }

            }}
            labelIcon={FileIcon}
            enableHover={true}
            onClick={() => (props.status && ['*deleted', 'deleted'].includes(props.status)) ? null : dispatch(loadCard({ filepath: props.path }))} />
    );
};
