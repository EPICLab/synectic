import { Add, Remove, SvgIconComponent, Warning } from '@material-ui/icons';
import { Branch } from '../../store/slices/branches';
import { Metafile, isFileMetafile, isVersionedMetafile } from '../../store/slices/metafiles';
import { getConflictingChunks, isDefined, isModified, isStaged, isUnmerged } from '../utils';

type useMotifHook = {
    color: string | undefined,
    icon: SvgIconComponent | undefined
}

export const useFileMotif = (metafile: Metafile | undefined): useMotifHook => {
    if (isDefined(metafile) && isFileMetafile(metafile) && isVersionedMetafile(metafile)) {
        const conflicted = isUnmerged(metafile.status) || getConflictingChunks(metafile.content).length > 0;
        const staged = isStaged(metafile.status);
        const unstaged = isModified(metafile.status);
        const icon = conflicted ? Warning : staged ? Remove : unstaged ? Add : undefined;
        // #da6473 => red, #61aeee => blue, #d19a66 => orange
        const color = conflicted ? '#da6473' : staged ? '#61aeee' : unstaged ? '#d19a66' : undefined;
        return { color: color, icon: icon };
    }
    return { color: undefined, icon: undefined };
}

export const useBranchMotif = (branch: Branch | undefined): useMotifHook => {
    if (isDefined(branch)) {
        // #da6473 => red, #61aeee => blue
        const color = branch.status === 'unmerged' ? '#da6473' : branch.linked ? '#61aeee' : undefined;
        return { color: color, icon: undefined };
    }
    return { color: undefined, icon: undefined };
}