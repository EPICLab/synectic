import { Add, Remove, SvgIconComponent, Warning } from '@material-ui/icons';
import { Branch } from '../../store/slices/branches';
import { Metafile, isFileMetafile, isVersionedMetafile } from '../../store/slices/metafiles';
import { getConflictingChunks, isDefined, isModified, isStaged, isUnmerged } from '../utils';
import { getColor } from '../colors';

type useMotifHook = {
  color: string | undefined;
  icon: SvgIconComponent | undefined;
};

export const useFileMotif = (metafile: Metafile | undefined): useMotifHook => {
  if (isDefined(metafile) && isFileMetafile(metafile) && isVersionedMetafile(metafile)) {
    const conflicted =
      isUnmerged(metafile.status) || getConflictingChunks(metafile.content).length > 0;
    const staged = isStaged(metafile.status);
    const unstaged = isModified(metafile.status);
    const icon = conflicted ? Warning : staged ? Remove : unstaged ? Add : undefined;
    const color = conflicted
      ? getColor('conflictRed').primary
      : staged
      ? getColor('stagedBlue').primary
      : unstaged
      ? getColor('unstagedOrange').primary
      : undefined;
    return { color: color, icon: icon };
  }
  return { color: undefined, icon: undefined };
};

export const useBranchMotif = (branch: Branch | undefined): useMotifHook => {
  if (isDefined(branch)) {
    const color =
      branch.status === 'unmerged'
        ? getColor('conflictRed').primary
        : branch.linked
        ? getColor('stagedBlue').primary
        : undefined;
    return { color: color, icon: undefined };
  }
  return { color: undefined, icon: undefined };
};
