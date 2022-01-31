import React from 'react';

export const ConflictRibbon: React.FunctionComponent<{ base: string, compare: string, onClick?: () => void }> = props => {
    const ribbonText = `Base: ${props.base}, Compare: ${props.compare}`;
    return (
        <div className='branch-ribbon-container' onClick={props.onClick} >
            <div className={`branch-ribbon ${ribbonText.length > 35 ? 'long' : ''}`}>
                {ribbonText}
            </div>
        </div>
    )
}