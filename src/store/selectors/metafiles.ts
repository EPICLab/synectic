import path from 'path';
import { PathLike } from 'fs-extra';
import type { Metafile } from '../../types';
import { RootState } from '../root';
import { isDirectory, readDirAsyncDepth } from '../../containers/io';
import { flattenArray } from '../../containers/flatten';
import { createAsyncThunk } from '@reduxjs/toolkit';

type DecomposedDirectory = {
    files: Metafile[],
    directories: Metafile[]
}

// splits filepaths into directory and file entry lists
const filterPaths = async (filepaths: PathLike[]): Promise<{ directories: PathLike[], files: PathLike[] }> => {
    return await filepaths.reduce(async (previousPromise: Promise<{ directories: PathLike[], files: PathLike[] }>, filepath: PathLike) => {
        const collection = await previousPromise;
        if (await isDirectory(filepath)) collection.directories.push(filepath);
        else collection.files.push(filepath);
        return collection;
    }, Promise.resolve({ directories: [], files: [] }));
};

export const getMetafileByPath = (targetPath: PathLike) => (state: RootState): Metafile[] => {
    return Object.values(state.metafiles)
        .filter(m => m.path !== undefined)
        .filter(m => m.path ? path.relative(m.path.toString(), targetPath.toString()) === '' : false);
}

export const getMetafilesByRoot =
    createAsyncThunk<DecomposedDirectory, PathLike, { state: RootState }>('test', async (root, { getState }) => {
        const filepaths = (await readDirAsyncDepth(root, 1))
            .filter(p => p !== root); // filter root filepath from results
        console.log(`getMetafilesByRoot => filepaths: ${JSON.stringify(filepaths)}`);
        const currPaths = await filterPaths(filepaths);
        const findMetafile = (targetPath: PathLike) => Object.values(getState().metafiles)
            .filter(m => m.path !== undefined)
            .filter(m => m.path ? path.relative(m.path.toString(), targetPath.toString()) === '' : false);
        const files = flattenArray(currPaths.files.map(f => findMetafile(f)));
        const directories = flattenArray(currPaths.directories.map(d => findMetafile(d)));
        return { files: files, directories: directories };
    });

