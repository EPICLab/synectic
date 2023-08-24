import { Add, Remove, SvgIconComponent, Warning } from '@material-ui/icons';
import { Branch } from '../../store/slices/branches';
import { Metafile, isFileMetafile, isVersionedMetafile } from '../../store/slices/metafiles';
import { getConflictingChunks, isDefined, isModified, isStaged, isUnmerged } from '../utils';

type useMotifHook = {
  color: string | undefined;
  icon: SvgIconComponent | undefined;
};

const colorPicker = (colorName: string): string | undefined => {
  switch (colorName) {
    case 'red':
      return '#da6473';
    case 'blue':
      return '#61aeee';
    case 'orange':
      return '#d19a66';
    case 'green':
      return '#50c878';
  }
  return undefined;
};

export const useFileMotif = (metafile: Metafile | undefined): useMotifHook => {
  if (isDefined(metafile) && isFileMetafile(metafile) && isVersionedMetafile(metafile)) {
    const conflicted =
      isUnmerged(metafile.status) || getConflictingChunks(metafile.content).length > 0;
    const staged = isStaged(metafile.status);
    const unstaged = isModified(metafile.status);
    const icon = conflicted ? Warning : staged ? Remove : unstaged ? Add : undefined;
    const color = conflicted
      ? colorPicker('red')
      : staged
      ? colorPicker('blue')
      : unstaged
      ? colorPicker('orange')
      : undefined;
    return { color: color, icon: icon };
  }
  return { color: undefined, icon: undefined };
};

export const useBranchMotif = (branch: Branch | undefined): useMotifHook => {
  if (isDefined(branch)) {
    const color =
      branch.status === 'unmerged'
        ? colorPicker('red')
        : branch.linked
        ? colorPicker('blue')
        : undefined;
    return { color: color, icon: undefined };
  }
  return { color: undefined, icon: undefined };
};
