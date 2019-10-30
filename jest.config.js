module.exports = {
  testEnvironment: 'enzyme',
  setupFilesAfterEnv: ['jest-enzyme'],
  testEnvironmentOptions: {
    enzymeAdapter: 'react16'
  },
  preset: 'ts-jest',
  roots: ['<rootDir>/__test__'],
  snapshotSerializers: ['enzyme-to-json/serializer']
}; 