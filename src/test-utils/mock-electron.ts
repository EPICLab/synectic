const sampleFilePaths = ['./src/test-utils/mock-file.ts', './src/test-utils/mock-store.ts'];
const sampleFilePath = './src/test-utils/mock-file.ts';

export const remote = {
    dialog: {
        // replace the showOpenDialog and showSaveDialog functions with spies which return a valid value
        showOpenDialog: jest.fn().mockReturnValue(new Promise((resolve) => resolve({ canceled: false, filePaths: sampleFilePaths }))),
        showSaveDialog: jest.fn().mockReturnValue(new Promise((resolve) => resolve({ canceled: false, filePath: sampleFilePath })))
    }
}