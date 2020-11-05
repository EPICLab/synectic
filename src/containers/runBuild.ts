import { exec } from 'child_process';
import { clone, statusMatrix, commit } from 'isomorphic-git';
import * as fs from 'fs-extra';
import * as http from 'isomorphic-git/http/node';
import { join } from 'path';

import { getRepoRoot } from '../containers/git';

// Helper function that copies a file and moves it to a new directory
const copyFile = (src: string, filePath: string, dest: string) => {
    const sPath = join(src, filePath);
    const dPath = join(dest, filePath);
    fs.copyFile(sPath, dPath);
}

const runBuild = async (remoteRepoURL: string, localRepo: fs.PathLike, copiedRepo: fs.PathLike): Promise<void> => {
    // Clone the remote repo to .syn directory within the copied repo's root dir
    const copiedRepoRoot = `${await getRepoRoot(copiedRepo)}\\.syn`;
    await clone({
        fs,
        http,
        dir: copiedRepoRoot,
        corsProxy: 'https://cors.isomorphic-git.org',
        url: remoteRepoURL,
        singleBranch: true,
        depth: 1,
    });
    console.log("\nFinished cloning!\n");

    // Get the staged files in the local repo
    const FILE = 0, WORKDIR = 2, STAGE = 3

    const stagedFiles = (await statusMatrix({ fs, dir: localRepo.toString() }))
        .filter(row => row[WORKDIR] === 2 && row[STAGE] === 2)
        .map(row => row[FILE]);
    console.log(`\nStaged files: ${stagedFiles}\n`);

    // Copy the local staged files to the cloned repo
    stagedFiles.map((file) => {
        copyFile(localRepo.toString(), file, copiedRepoRoot);
    });

    // Create a commit with these staged changes
    const com = await commit({
        fs,
        dir: copiedRepoRoot,
        author: {
            name: 'Mr. Test',
            email: 'mrtest@example.com',
        },
        message: `Made changes to files ${stagedFiles}`,
    });
    console.log(`\nCommit: ${com}\n`);

    // Run npm install
    const install = exec('npm install', { cwd: copiedRepoRoot }, (error, stdout, stderr) => {
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

        const portfolio = exec('npm run-script build', { cwd: copiedRepoRoot }, (error, stdout, stderr) => {
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
}

export default runBuild;