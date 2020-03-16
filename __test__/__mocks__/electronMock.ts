const sampleFilePaths = ['./__test__/__mocks__/fileMock.js', './__test__/__mocks__/dndReduxMock.tsx'];

export const remote = {
  dialog: {
    // replace the showOpenDialog function with a spy which returns a value
    showOpenDialog: jest.fn().mockReturnValue(new Promise((resolve) => resolve({ canceled: false, filePaths: sampleFilePaths })))
  }
}