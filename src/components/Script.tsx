import React from 'react';
import { Button } from '@material-ui/core';
import { exec } from 'child_process';
import { clone, statusMatrix, commit } from 'isomorphic-git';
import * as fs from 'fs-extra';
import * as http from 'isomorphic-git/http/node';

const Script: React.FunctionComponent = () => {

    const copyFile = (src: string, filePath: string, dest: string) => {
        const sPath = src + "\\" + filePath;
        const dPath = dest + "\\" + filePath;
        fs.copyFile(sPath, dPath);
    }

    const handleClick = async (e: React.MouseEvent) => {
        e.preventDefault();

        // Clone the remote repo to .syn directory within phaser project
        // TODO: change to find the root directory using git.getRepoRoot(), then save .syn dir to root dir
        await clone({
            fs,
            http,
            dir: 'C:\\Users\\15034\\Desktop\\phaser2\\.syn',
            corsProxy: 'https://cors.isomorphic-git.org',
            url: 'https://github.com/photonstorm/phaser.git',
            singleBranch: true,
            depth: 1,
        });
        console.log("\nFinished cloning!\n");

        // Get the staged files in the local repo
        const FILE = 0, WORKDIR = 2, STAGE = 3

        const stagedFiles = (await statusMatrix({ fs, dir: "C:\\Users\\15034\\Desktop\\localPhaser" }))
            .filter(row => row[WORKDIR] === 2 && row[STAGE] === 2)
            .map(row => row[FILE]);
        console.log(`\nStaged files: ${stagedFiles}\n`);

        // Copy the local staged files to the cloned repo
        stagedFiles.map((file) => {
            copyFile("C:\\Users\\15034\\Desktop\\localPhaser", file, "C:\\Users\\15034\\Desktop\\phaser2\\.syn");
        });

        // Create a commit with these staged changes
        const com = await commit({
            fs,
            dir: 'C:\\Users\\15034\\Desktop\\phaser2\\.syn',
            author: {
                name: 'Mr. Test',
                email: 'mrtest@example.com',
            },
            message: `Made changes to files ${stagedFiles}`,
        });
        console.log(`\nCommit: ${com}\n`);

        // Run npm install
        const install = exec('npm install', { cwd: 'C:\\Users\\15034\\Desktop\\phaser2\\.syn' }, (error, stdout, stderr) => {
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
            console.log(`\n(run-script build) Child process exited with exit code: ${code}\n`);

            const portfolio = exec('npm run-script build', { cwd: 'C:\\Users\\15034\\Desktop\\phaser2\\.syn' }, (error, stdout, stderr) => {
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