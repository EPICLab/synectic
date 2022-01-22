import React, { useState } from 'react';
import FolderIcon from '@material-ui/icons/Folder';
import FolderOpenIcon from '@material-ui/icons/FolderOpen';
import { StyledTreeItem } from '../StyledTreeComponent';
import { DirectoryMetafile, isDirectoryMetafile, isFileMetafile } from '../../store/thunks/metafiles';
import { FileComponent } from "./FileComponent";
import { useAppSelector } from '../../store/hooks';
import metafileSelectors from '../../store/selectors/metafiles';
import { RootState } from '../../store/store';


export const DirectoryComponent: React.FunctionComponent<DirectoryMetafile> = props => {
    const metafiles = useAppSelector((state: RootState) => metafileSelectors.selectByRoot(state, props.path));
    const [expanded, setExpanded] = useState(false);

    const clickHandle = async () => setExpanded(!expanded);

    // expects a TreeView parent to encompass the StyledTreeItem below
    return (
        <StyledTreeItem key={props.id} nodeId={props.id}
            labelText={props.name}
            labelIcon={expanded ? FolderOpenIcon : FolderIcon}
            onClick={clickHandle}
        >
            {metafiles.filter(isDirectoryMetafile).map(dir => <DirectoryComponent key={dir.id} {...dir} />)}
            {metafiles.filter(isFileMetafile).map(file => <FileComponent key={file.id} metafileId={file.id} />)}
        </StyledTreeItem>
    );
};
