import * as fs from 'fs-extra';

export type TreeNode = {
    filePath: string;
    isFile: boolean;
    files: TreeNode[];
}

export const generateFileTreeObject = async (directory: string): Promise<TreeNode[]> => {
    const filenames = await fs.readdir(directory);
    const fileDataPromises = filenames.map(async (fileNameString) => {
        const fullPath = `${directory}/${fileNameString}`;
        const fileData = await fs.stat(fullPath);
        const file: TreeNode = {
            filePath: fullPath,
            isFile: fileData.isFile(),
            files: []
        };
        /*Here is where we'll do our recursive call*/
        if (!file.isFile) {
            file.files = await generateFileTreeObject(file.filePath);
        }
        /*End recursive condition*/
        return file;
    });
    return Promise.all(fileDataPromises);
};