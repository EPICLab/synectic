import React, { useEffect } from 'react';
import { UUID } from '../types';

import TreeItem from '@material-ui/lab/TreeItem';
import useBranchStatus from '../store/hooks/useGitStatus';

const BranchComponent: React.FunctionComponent<{ repo: UUID, branch: string }> = props => {
  const [{ cards, modified, status }, { fetch }] = useBranchStatus(props.repo, props.branch);

  useEffect(() => {
    if (Object.keys(status).length > 0) console.log(`${props.branch} => status: ${JSON.stringify(status)}`);
  }, [props.branch, status]);

  return (
    <TreeItem nodeId={`${props.repo}-${props.branch}`} label={`${props.branch} [${modified}/${cards.length}]`} onClick={fetch} />
  );
};

export default BranchComponent;