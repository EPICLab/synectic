import React from 'react';

export const BranchRibbon: React.FunctionComponent<{ branch?: string }> = props => {
  if (props.branch) {
    return (
      <div className='branch-ribbon-container'>
        <div className={`branch-ribbon ${props.branch.length > 35 ? 'long' : ''}`}>
          {`Branch: ${props.branch}`}
        </div>
      </div>
    )
  } else {
    return null;
  }
}