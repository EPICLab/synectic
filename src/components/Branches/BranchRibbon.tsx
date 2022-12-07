import { Skeleton } from '@material-ui/lab';
import clsx from 'clsx';
import React from 'react';
import { useAppSelector } from '../../store/hooks';
import branchSelectors from '../../store/selectors/branches';
import { Metafile } from '../../store/slices/metafiles';

const BranchRibbon = ({ metafile, onClick }: { metafile: Metafile | undefined, onClick?: () => void }) => {
  const branch = useAppSelector(state => branchSelectors.selectById(state, metafile?.branch ?? ''));
  const loading = (metafile?.flags?.length ?? 0) > 0;
  const ribbonText = `Branch: ${branch ? branch.ref : ''}`;

  return (
    <>
      <div onClick={onClick}
        className={clsx('branch-ribbon-container', {
          'preview': loading,
          'unmerged': branch?.status === 'unmerged',
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