import React from 'react';
import { InsertDriveFile, Add, Remove } from '@material-ui/icons';
import type { GitStatus, Metafile, Repository } from '../../types';
import { StyledTreeItem } from '../StyledTreeComponent';
import { extractFilename } from '../../containers/io';
import { add, remove } from '../../containers/git-plumbing';
import { removeUndefinedProperties } from '../../containers/format';

export const modifiedCheck = (status: GitStatus | undefined): boolean => {
    if (!status) return false;
    return !['absent', 'unmodified', 'ignored'].includes(status);
}

export const changedCheck = (status: GitStatus | undefined): boolean => {
    if (!status) return false;
    return ['*absent', '*added', '*undeleted', '*modified', '*deleted'].includes(status);
}

export const stagedCheck = (status: GitStatus | undefined): boolean => {
    if (!status) return false;
    return modifiedCheck(status) && !changedCheck(status);
}

export type SourceFileProps = {
    repository: Repository,
    update: () => Promise<void>
}

export const SourceFileComponent: React.FunctionComponent<Metafile & SourceFileProps> = props => {

    const colorFilter = (status: GitStatus | undefined) => (status && stagedCheck(status) ? '#61aeee'
        : (status && changedCheck(status) ? '#d19a66' : undefined));

    const iconFilter = (status: GitStatus | undefined) => (status && stagedCheck(status) ? Remove
        : (status && changedCheck(status) ? Add : undefined));

    const optionals = removeUndefinedProperties({ color: colorFilter(props.status), labelInfo: iconFilter(props.status) });

    return (
        <>
            {props.path ? <StyledTreeItem key={props.path.toString()} nodeId={props.path.toString()}
                labelText={extractFilename(props.path)}
                labelIcon={InsertDriveFile}
                {...optionals}
                enableHover={true}
                labelInfoClickHandler={async () => {
                    if (!props.status || !props.repo || !props.branch || !props.path) {
                        console.log('cannot do anything with an unmodified file');
                        return;
                    }
                    if (stagedCheck(props.status)) {
                        console.log(`unstaging ${extractFilename(props.path)}...`);
                        await remove(props.path, props.repository.root, props.branch);
                        await props.update();
                    } else if (modifiedCheck(props.status)) {
                        console.log(`staging ${extractFilename(props.path)}...`);
                        await add(props.path, props.repository.root, props.branch);
                        await props.update();
                    }
                }} />
                : null}
        </>
    );
};
