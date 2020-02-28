import * as fs from 'fs-extra';
import { v4 } from 'uuid';
import { Actions, ActionKeys } from '../store/actions';
import * as io from '../containers/io';
import { Metadir } from '../types';
import { extractMetafile } from './metafiles';
import * as fileTree from './filetree';

export const generateFileTreeActions = async (root: fs.PathLike) => {
    const paths = await fileTree.extractFileTreeNames(root);
    const actionPromises = paths.map(async (path) => {
        if (typeof await fileTree.isFile(path) !== "undefined") {
            const addFileAction = await extractMetafile(path, []);
            return addFileAction;
        } else {
            const allChildren = await fs.readdir(path);
            const childDirs = fileTree.removeUndefined(await Promise.all(allChildren.map(child => fileTree.isDir(`${path.toString()}/${child}`))));
            const childFiles = fileTree.removeUndefined(await Promise.all(allChildren.map(child => fileTree.isFile(`${path.toString()}/${child}`))));
            const metadir: Metadir = {
                id: v4(),
                name: io.extractFilename(path),
                path: path,
                expanded: false,
                containsDir: childDirs,
                containsFile: childFiles
            };
            const addMetaDirAction: Actions = { type: ActionKeys.ADD_FE, id: metadir.id, metadir: metadir };
            return addMetaDirAction;
        }
    });
    const actions = await Promise.all(actionPromises);
    return actions;
}