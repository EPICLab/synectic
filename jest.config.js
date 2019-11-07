module.exports = {
  testEnvironment: 'enzyme',
  setupFilesAfterEnv: ['jest-enzyme'],
  testEnvironmentOptions: {
    enzymeAdapter: 'react16'
  },
  preset: 'ts-jest',
  roots: ['<rootDir>/__test__'],
  snapshotSerializers: ['enzyme-to-json/serializer'],
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx'],
  moduleNameMapper: {
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$": '<rootDir>/__mocks__/fileMock.js',
    "\\.(css|less)$": 'identity-obj-proxy'
  }
}; 