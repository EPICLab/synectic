import React from 'react';

import type { UUID } from '../types';
import { useBranchStatus } from '../store/hooks/useBranchStatus';
import { StyledTreeItem } from './StyledTreeComponent';
import { GitBranchIcon } from './GitIcons';

const BranchStatus: React.FunctionComponent<{ repo: UUID, branch: string }> = props => {
  const { cards, modified, status } = useBranchStatus(props.repo, props.branch);

  return (
    <StyledTreeItem key={`${props.repo}-${props.branch}`} nodeId={`${props.repo}-${props.branch}`}
      labelText={`${props.branch} [${modified.length}/${cards.length}]`}
      labelIcon={GitBranchIcon}
      onClick={() => cards.map(async c => await status(c))}
    />);
};

export default BranchStatus;