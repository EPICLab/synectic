import { Add, Remove, SvgIconComponent, Warning } from '@mui/icons-material';
import { Branch } from '../../store/slices/branches';
import { Metafile, isFileMetafile, isVersionedMetafile } from '../../store/slices/metafiles';
import { getConflictingChunks, isDefined, isModified, isStaged, isUnmerged } from '../utils';

type Actionable = 'conflicted' | 'staged' | 'unstaged';

type useMotifHook = {
  actionable: Actionable | undefined;
  color: string | undefined;
  icon: SvgIconComponent | undefined;
};

export const useFilebasedMotif = (metafile: Metafile | undefined): useMotifHook => {
  if (isVersionedMetafile(metafile)) {
    const conflicted =
      isUnmerged(metafile.status) ||
      (isFileMetafile(metafile) &&
        isDefined(metafile.content) &&
        getConflictingChunks(metafile.content).length > 0);
    const staged = isStaged(metafile.status);
    const unstaged = isModified(metafile.status);
    const untracked = metafile.status === 'absent' || metafile.status === '*absent';
    const icon = conflicted ? Warning : staged ? Remove : unstaged ? Add : undefined;
    const action: Actionable | undefined = conflicted
      ? 'conflicted'
      : staged
      ? 'staged'
      : untracked || unstaged
      ? 'unstaged'
      : undefined;
    // #da6473 => red, #61aeee => blue, #d19a66 => orange, #50c878 => green
    const color = conflicted
      ? '#da6473'
      : staged
      ? '#61aeee'
      : untracked
      ? '#50c878'
      : unstaged
      ? '#d19a66'
      : undefined;
    return { actionable: action, color: color, icon: icon };
  }
  return { actionable: undefined, color: undefined, icon: undefined };
};

export const useBranchMotif = (branch: Branch | undefined): useMotifHook => {
  if (isDefined(branch)) {
    // #da6473 => red, #61aeee => blue
    const color = branch.status === 'unmerged' ? '#da6473' : branch.linked ? '#61aeee' : undefined;
    return { actionable: undefined, color: color, icon: undefined };
  }
  return { actionable: undefined, color: undefined, icon: undefined };
};
