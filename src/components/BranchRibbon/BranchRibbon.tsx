import React from 'react';

const BranchRibbon = (props: { branch?: string, onClick?: () => void }) => {
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

export default BranchRibbon;