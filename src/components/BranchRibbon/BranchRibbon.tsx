import { Skeleton } from '@material-ui/lab';
import React from 'react';
import clsx from 'clsx';
import { useAppSelector } from '../../store/hooks';
import branchSelectors from '../../store/selectors/branches';
import { Metafile } from '../../store/slices/metafiles';
import { RootState } from '../../store/store';
import metafileSelectors from '../../store/selectors/metafiles';

const BranchRibbon = ({ metafile, onClick }: { metafile: Metafile | undefined, onClick?: () => void }) => {
  const branch = useAppSelector((state: RootState) => branchSelectors.selectById(state, metafile?.branch ?? ''));
  const conflicted = useAppSelector((state: RootState) => metafileSelectors.selectByConflicted(state, metafile?.repo ?? '', metafile?.branch ?? ''));
  const loading = (metafile?.flags?.length ?? 0) > 0;
  const ribbonText = `Branch: ${branch ? branch.ref : ''}`;

  return (
    <>
      <div onClick={onClick}
        className={clsx('branch-ribbon-container', {
          'preview': loading,
          'unmerged': conflicted.length > 0,
        })}>
        {loading ?
          <Skeleton variant='rect' aria-label='loading' animation='wave'>
            <div className={clsx('branch-ribbon', { 'long': ribbonText.length > 35 })} >
              {ribbonText}
            </div>
          </Skeleton> :
          <div className={clsx('branch-ribbon', { 'long': ribbonText.length > 35 })}>
            {ribbonText}
          </div>}
      </div>
    </>
  );
}

export default BranchRibbon;