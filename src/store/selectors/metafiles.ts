import { PathLike } from 'fs-extra';
import type { Metafile } from '../../types';
import { metafilesAdapter } from '../slices/metafiles';
import { RootState } from '../store';

export const selectAllMetafiles = metafilesAdapter.getSelectors<RootState>(state => state.metafiles);

export const selectMetafileByFilepath = (filepath: PathLike) => (state: RootState): Metafile | undefined => {
    return Object.values(state.metafiles)
        .find(m => m.path === filepath);
}

export const selectMetafileByBranch = (filepath: PathLike, branch: string) => (state: RootState): Metafile | undefined => {
    return Object.values(state.metafiles)
        .find(m => m.path === filepath && m.branch === branch);
}

export const selectMetafileByVirtual = (name: string, handler: string) => (state: RootState): Metafile | undefined => {
    return Object.values(state.metafiles)
        .find(m => m.name === name && m.handler === handler);
}