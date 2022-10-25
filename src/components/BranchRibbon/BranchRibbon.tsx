import { makeStyles } from '@material-ui/core';
import { Skeleton } from '@material-ui/lab';
import React from 'react';
import clsx from 'clsx';
import { useAppSelector } from '../../store/hooks';
import branchSelectors from '../../store/selectors/branches';
import { Metafile } from '../../store/slices/metafiles';
import { RootState } from '../../store/store';

const useStyles = makeStyles({
  branchRibbonContainer: {
    backgroundColor: 'rgb(72, 74, 212, 1)'
  },
  branchRibbonPreview: {
    backgroundColor: 'rgb(72, 74, 212, 0.7)'
  }
});

const BranchRibbon = ({ metafile, onClick }: { metafile: Metafile | undefined, onClick?: () => void }) => {
  const styles = useStyles();
  const branch = useAppSelector((state: RootState) => branchSelectors.selectById(state, metafile && metafile.branch ? metafile.branch : ''));
  const loading = metafile?.flags?.includes('updating') ?? false;

  const ribbonText = `Branch: ${branch ? branch.ref : ''}`;

  return (
    <>
      {loading ?
        <div className={styles.branchRibbonPreview} onClick={onClick} >
          <Skeleton variant='rect' aria-label='loading' animation='wave'>
            <div className={'branch-ribbon'} style={{ width: 250 }}>
              {ribbonText}
            </div>
          </Skeleton>
        </div>
        : branch ?
          <div className={styles.branchRibbonContainer} onClick={onClick} >
            <div className={clsx('branch-ribbon', { 'long': ribbonText.length > 35 })}>
              {ribbonText}
            </div>
          </div>
          : null
      }
    </>
  );
}

export default BranchRibbon;