import * as fs from 'fs-extra';
import * as io from './io';

//File/folder type:
export type TreeNode = {
    filePath: string;
    isFileBool: boolean;
    files: TreeNode[];
}

/**
 * Generates folder and file objects given a root directory path.
 * @param directory The directory path.
 * @return Array of tree node objects (directories and files found within given directory path).
 */
export const generateTreeNodeObject = (directory: fs.PathLike): Promise<TreeNode[]> => {

    return new Promise(async (resolve, reject) => {
        var blah: TreeNode[] = [];
        io.readDirAsync(directory.toString())
            .then(files => {
                files.map(fileName => {
                    const fullPath = `${directory}/${fileName}`;

                    const fileData = await fs.stat(fullPath); //What here tho??

                    const file: TreeNode = {
                        filePath: '',
                        isFileBool: false,
                        files: [],
                    };

                    file.filePath = fullPath;
                    file.isFileBool = fileData.isFile();

                    /*Recursive call will go here*/

                    blah[0] = file;
                });
                resolve(blah);
            })
            .catch(error => {
                console.log(error);
                reject(error);
            });
    });

    // const fileData = arrayOfFileNameStrings.map(async fileName => {

    //     const fullPath = `${directory.toString()}/${fileName}`;

    //     const fileData = await fs.stat(fullPath);

    //     const file: TreeNode = {
    //         filePath: '',
    //         isFileBool: false,
    //         files: [],
    //     };

    //     file.filePath = fullPath;

    //     file.isFileBool = fileData.isFile();

    //     /* Start recursive call */
    //     // if (!file.isFileBool) {
    //     //     file.files = await generateTreeNodeObject(file.filePath);
    //     // }
    //     /* End recursive call */

    //     return file;
    // });

    // return Promise.all(fileData);

    // return new Promise(resolve => {
    //     console.log(directory.toString());
    //     // process.stdout.write(`generateTreeNodeObject, directory: ${directory.toString()}` + '\n');
    //     resolve('finished');
    // });
};