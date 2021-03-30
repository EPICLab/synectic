const sampleFilePaths = ['./__test__/__mocks__/fileMock.js', './__test__/__mocks__/reduxStoreMock.ts'];
const sampleFilePath = './__test__/__mocks__/fileMock.js';

export const remote = {
  dialog: {
    // replace the showOpenDialog and showSaveDialog functions with spies which return a valid value
    showOpenDialog: jest.fn().mockReturnValue(new Promise((resolve) => resolve({ canceled: false, filePaths: sampleFilePaths }))),
    showSaveDialog: jest.fn().mockReturnValue(new Promise((resolve) => resolve({ canceled: false, filePath: sampleFilePath })))
  }
}