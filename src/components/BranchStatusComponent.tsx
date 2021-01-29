import React from 'react';
import TreeItem from '@material-ui/lab/TreeItem';

import type { UUID } from '../types';
import { useBranchStatus } from '../store/hooks/useBranchStatus';

const BranchComponent: React.FunctionComponent<{ repo: UUID, branch: string }> = props => {
  const { cards, modified, status } = useBranchStatus(props.repo, props.branch);

  return (
    <TreeItem nodeId={`${props.repo}-${props.branch}`}
      label={`${props.branch} [${modified.length}/${cards.length}]`} onClick={() => cards.map(async c => await status(c))} />
  );
};

export default BranchComponent;