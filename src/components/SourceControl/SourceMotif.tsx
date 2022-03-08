import { FileMetafile } from '../../store/thunks/metafiles';
import { Add, Remove, SvgIconComponent, Warning } from '@material-ui/icons';

export type SourceMotif = {
    color: string | undefined,
    icon: SvgIconComponent | undefined
}

export const conflictedCheck = (metafile: FileMetafile) => metafile.conflicts ? metafile.conflicts.length > 0 : false;
export const stagedCheck = (metafile: FileMetafile) => metafile.status ? ['added', 'modified', 'deleted'].includes(metafile.status) : false;
export const unstagedCheck = (metafile: FileMetafile) => metafile.status ? ['*absent', '*added', '*undeleted', '*modified', '*deleted'].includes(metafile.status) : false;

export const getSourceMotif = (metafile: FileMetafile): SourceMotif => {
    if (metafile.status) {
        const conflicts = conflictedCheck(metafile);
        const staged = stagedCheck(metafile);
        const unstaged = unstagedCheck(metafile);
        const icon = conflicts ? Warning : staged ? Remove : unstaged ? Add : undefined;
        // #da6473 => red, #61aeee => blue, #d19a66 => orange
        const color = conflicts ? '#da6473' : staged ? '#61aeee' : unstaged ? '#d19a66' : undefined;
        return { color: color, icon: icon };
    }
    return { color: undefined, icon: undefined };
};
