import { Metadir } from "../types";
import { removeUndefined } from "../containers/filetree";
import TreeItem from "@material-ui/lab/TreeItem";
import React from "react";
import * as io from '../containers/io';

const RenderTree = (currDir: Metadir, metadirs: Metadir[], handleClick: (e: React.MouseEvent<Element, MouseEvent>, path: string) => Promise<void>) => {
    const childFiles: string[] = currDir.containsFile;

    const childDirs: Metadir[] = removeUndefined(currDir.containsDir.map((dirPath) => {
        for (let i = 0; i < metadirs.length; i++) {
            if (metadirs[i].path === dirPath) return metadirs[i];
        }
    }));

    return (
        <TreeItem key={currDir.id} nodeId={currDir.id} label={currDir.name} >
            {
                childDirs.map(dir => RenderTree(dir, metadirs, handleClick))
            }
            {
                childFiles.map(file => <TreeItem key={file} nodeId={file} onClick={async (e) => { await handleClick(e, file) }} label={io.extractFilename(file)}></TreeItem>)
            }
        </TreeItem >
    );
}

export default RenderTree;