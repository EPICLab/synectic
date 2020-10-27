import React from 'react';
import { Button } from '@material-ui/core';
import { exec } from 'child_process';
import { clone, listFiles } from 'isomorphic-git';
import * as fs from 'fs-extra';
import * as http from 'isomorphic-git/http/node';

const Script: React.FunctionComponent = () => {

    const handleClick = async (e: React.MouseEvent) => {
        e.preventDefault();

        // Clone the remote repo to .syn directory
        await clone({
            fs,
            http,
            dir: 'C:\\Users\\15034\\Desktop\\synectic\\.syn',
            corsProxy: 'https://cors.isomorphic-git.org',
            url: 'https://github.com/photonstorm/phaser.git',
            singleBranch: true,
            depth: 1,
        });
        console.log("\nFinished cloning!\n");

        // Get the staged files in local repo
        const stagedFiles = await listFiles({ fs, dir: "C:\\Users\\15034\\Desktop\\synectic" });
        console.log(`\nStaged files: ${stagedFiles}\n`);

        // Copy local staged files to cloned repo


        // Create a commit with these staged changes


        // Run npm install
        const install = exec('npm install', { cwd: 'C:\\Users\\15034\\Desktop\\synectic\\.syn' }, (error, stdout, stderr) => {
            if (error) {
                console.log(`\n(install) Error stack:\n${error.stack}\n`);
                console.log(`\n(install) Error code: ${error.code}\n`);
                console.log(`\n(install) Signal received: ${error.signal}\n`);
            }
            console.log(`\n(install) Child Process STDOUT: ${stdout}\n`);
            console.log(`\n(install) Child Process STDERR: ${stderr}\n`);
        });

        // Run the build
        install.on('exit', (code) => {
            console.log(`\n(install) Child process exited with exit code: ${code}\n`);

            const portfolio = exec('npm run-script build', { cwd: 'C:\\Users\\15034\\Desktop\\synectic\\.syn' }, (error, stdout, stderr) => {
                if (error) {
                    console.log(`\n(run-script build) Error stack:\n${error.stack}\n`);
                    console.log(`\n(run-script build) Error code: ${error.code}\n`);
                    console.log(`\n(run-script build) Signal received: ${error.signal}\n`);
                }
                console.log(`\n(run-script build) Child Process STDOUT: ${stdout}\n`);
                console.log(`\n(run-script build) Child Process STDERR: ${stderr}\n`);
            });

            portfolio.on('exit', (code) => {
                console.log(`\n(run-script build) Child process exited with exit code: ${code}\n`);
            });
        });
    };

    return (
        <Button id='newcard-button' variant='contained' color='primary' onClick={(e) => { handleClick(e) }}>Script...</Button>
    );
};

export default Script;