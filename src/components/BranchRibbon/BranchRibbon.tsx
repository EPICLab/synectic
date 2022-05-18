import { Skeleton } from '@material-ui/lab';
import React, { useState } from 'react';
import { getRandomInt } from '../../containers/utils';
import { useAppSelector } from '../../store/hooks';
import branchSelectors from '../../store/selectors/branches';
import { Metafile } from '../../store/slices/metafiles';
import { RootState } from '../../store/store';

const BranchRibbon = ({ metafile, onClick }: { metafile: Metafile | undefined, onClick?: () => void }) => {
  const [random] = useState(getRandomInt(55, 90));
  const branch = useAppSelector((state: RootState) => branchSelectors.selectById(state, metafile && metafile.branch ? metafile.branch : ''));

  const ribbonText = `Branch: ${branch ? branch.ref : ''}`;

  return (
    <>
      {metafile && metafile.loading ?
        <div className='branch-ribbon-container' onClick={onClick} >
          <Skeleton variant='text' aria-label='loading' width={`${random}%`} />
        </div> :
        branch ? <div className='branch-ribbon-container' onClick={onClick} >
          <div className={`branch-ribbon ${ribbonText.length > 35 ? 'long' : ''}`}>
            {ribbonText}
          </div>
        </div> :
          null
      }
    </>
  );
}

export default BranchRibbon;