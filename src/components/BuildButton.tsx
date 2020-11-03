import React from 'react';
import { Button } from '@material-ui/core';
import runBuild from '../containers/runBuild';

const BuildButton: React.FunctionComponent = () => {
    const handleClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        await runBuild("https://github.com/photonstorm/phaser.git", "C:\\Users\\15034\\Desktop\\localPhaser", "C:\\Users\\15034\\Desktop\\phaser2");
    };

    return (
        <Button id='newcard-button' variant='contained' color='primary' onClick={(e) => { handleClick(e) }}>Run Build...</Button>
    );
};

export default BuildButton;