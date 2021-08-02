import React from 'react';

const Block: React.FunctionComponent = props => {
    return (
        <div>
            <span>BLOCK</span>
            { props.children }
        </div>
    );
}

export default Block;