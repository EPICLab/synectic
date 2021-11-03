import React, { useState } from 'react';
import FolderIcon from '@material-ui/icons/Folder';
import FolderOpenIcon from '@material-ui/icons/FolderOpen';
import { StyledTreeItem } from '../StyledTreeComponent';
import useDirectory from '../../containers/hooks/useDirectory';
import { DirectoryMetafile } from '../../store/thunks/metafiles';
import { FileComponent } from "./FileComponent";


export const DirectoryComponent: React.FunctionComponent<DirectoryMetafile> = props => {
    const { directories, files, update } = useDirectory(props.path);
    const [expanded, setExpanded] = useState(false);

    const clickHandle = async () => setExpanded(!expanded);

    // expects a TreeView parent to encompass the StyledTreeItem below
    return (
        <StyledTreeItem key={props.id} nodeId={props.id}
            labelText={props.name}
            labelIcon={expanded ? FolderOpenIcon : FolderIcon}
            onClick={clickHandle}
        >
            {directories.map(dir => <DirectoryComponent key={dir.id} {...dir} />)}
            {files.map(file => <FileComponent key={file.id} update={update} {...file} />)}
        </StyledTreeItem>
    );
};
