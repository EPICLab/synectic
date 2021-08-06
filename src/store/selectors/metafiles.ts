import { EntityState } from '@reduxjs/toolkit';
import { PathLike } from 'fs-extra';
import type { Metafile } from '../../types';
import { RootState } from '../store';

export const selectMetafiles = (state: RootState): EntityState<Metafile> => state.metafiles;

export const getMetafileByFilepath = (filepath: PathLike) => (state: RootState): Metafile | undefined => {
    return Object.values(state.metafiles)
        .find(m => m.path === filepath);
}

export const getMetafileByBranch = (filepath: PathLike, branch: string) => (state: RootState): Metafile | undefined => {
    return Object.values(state.metafiles)
        .find(m => m.path === filepath && m.branch === branch);
}

export const getMetafileByVirtual = (name: string, handler: string) => (state: RootState): Metafile | undefined => {
    return Object.values(state.metafiles)
        .find(m => m.name === name && m.handler === handler);
}