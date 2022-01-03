import React from 'react';

export const BranchRibbon: React.FunctionComponent<{ branch?: string, onClick?: () => void }> = props => {
  const ribbonText = `Branch: ${props.branch}`;
  if (props.branch) {
    return (
      <div className='branch-ribbon-container' onClick={props.onClick} >
        <div className={`branch-ribbon ${ribbonText.length > 35 ? 'long' : ''}`}>
          {ribbonText}
        </div>
      </div>
    )
  } else {
    return null;
  }
}