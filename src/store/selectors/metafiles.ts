import { PathLike } from 'fs-extra';
import type { Metafile } from '../../types';
import { metafilesAdapter } from '../slices/metafiles';
import { RootState } from '../store';

export const metafileSelectors = metafilesAdapter.getSelectors<RootState>(state => state.metafiles);

export const selectMetafileByFilepath = (state: RootState, filepath: PathLike): Metafile | undefined => {
    return Object.values(state.metafiles)
        .find(m => m.path === filepath);
}

export const selectMetafileByBranch = (state: RootState, filepath: PathLike, branch: string): Metafile | undefined => {
    return Object.values(state.metafiles)
        .find(m => m.path === filepath && m.branch === branch);
}

export const selectMetafileByVirtual = (state: RootState, name: string, handler: string): Metafile | undefined => {
    return Object.values(state.metafiles)
        .find(m => m.name === name && m.handler === handler);
}