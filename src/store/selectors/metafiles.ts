import path from 'path';
import { PathLike } from 'fs-extra';
import { Metafile } from '../../types';
import { RootState } from '../root';

export const getMetafileByPath = (targetPath: PathLike) => (state: RootState): Metafile[] => {
    return Object.values(state.metafiles)
        .filter(m => m.path !== undefined)
        .filter(m => m.path ? path.relative(m.path.toString(), targetPath.toString()) === '' : false);
}
