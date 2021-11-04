import React, { useState } from 'react';
import { InsertDriveFile as FileIcon, Add, Remove } from '@material-ui/icons';
import { GitStatus } from '../../types';
import { RootState } from '../../store/store';
import { loadCard } from '../../store/thunks/handlers';
import { extractFilename } from '../../containers/io';
import { StyledTreeItem } from '../StyledTreeComponent';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { add, remove } from '../../containers/git-plumbing';
import repoSelectors from '../../store/selectors/repos';
import { removeUndefinedProperties } from '../../containers/format';
import { FileMetafile } from '../../store/thunks/metafiles';

export const FileComponent: React.FunctionComponent<FileMetafile & { update: () => Promise<void> }> = props => {
    const repos = useAppSelector((state: RootState) => repoSelectors.selectAll(state));
    const [repo] = useState(repos.find(r => r.id === props.repo));
    const dispatch = useAppDispatch();

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

    const colorFilter = (status: GitStatus | undefined) => (status && stagedCheck(status) ? '#61aeee'
        : (status && changedCheck(status) ? '#d19a66' : undefined));

    const iconFilter = (status: GitStatus | undefined) => (status && stagedCheck(status) ? Remove
        : (status && changedCheck(status) ? Add : undefined));

    const optionals = removeUndefinedProperties({ color: colorFilter(props.status), labelInfo: iconFilter(props.status) });

    // expects a TreeView parent to encompass the StyledTreeItem below
    return (
        <StyledTreeItem key={props.id} nodeId={props.id}
            labelText={extractFilename(props.path)}
            {...optionals}
            labelInfoClickHandler={async (e) => {
                e.stopPropagation(); // prevent propogating the click event to the StyleTreeItem onClick method
                if (!props.status || !props.repo || !props.branch || !props.path || !repo) {
                    console.log('cannot do anything with an unmodified file');
                    return;
                }
                if (stagedCheck(props.status)) {
                    console.log(`unstaging ${extractFilename(props.path)}...`);
                    await remove(props.path, repo, props.branch);
                    await props.update();
                } else if (modifiedCheck(props.status)) {
                    console.log(`staging ${extractFilename(props.path)}...`);
                    await add(props.path, repo, props.branch);
                    await props.update();
                }
            }}
            labelIcon={FileIcon}
            enableHover={true}
            onClick={() => (props.status && ['*deleted', 'deleted'].includes(props.status)) ? null : dispatch(loadCard({ filepath: props.path }))} />
    );
};
