// import mock from 'mock-fs';
import React from 'react';
import configureStore from 'redux-mock-store';
import { mount } from 'enzyme';
import { Provider } from 'react-redux';
import * as handlers from '../src/containers/handlers';

describe('handlers.importFiletypes', () => {
  // const falseFiletypesPath = 'bar/config/filetypes.json';
  const mockStore = configureStore([]);

  it('importFiletypes updates state on valid filetypes.json file', () => {
    const initialState: unknown = [];
    const store = mockStore(initialState);
    const wrapper = mount(<Provider store={store} > <button id='test-button' onClick={async () => { await handlers.importFiletypes() }} /></Provider >);
    wrapper.find('#test-button').first().simulate('click');
    expect(store.getState()).toBe(true);
  });

  it('importFiletypes throws error on missing filetypes.json file', () => {
    expect(true).toBe(false);
    // return expect(handlers.importFiletypes(falseFiletypesPath)).toThrow(Error);
  });
});

describe('handlers.extractMetafile', () => {
  it('extractMetafile updates state with new metafile on supported filetype', () => {
    expect(true).toBe(false);
  });

  it('extractMetafile updates state with new metafile on unsupported filetype', () => {
    expect(true).toBe(false);
  });
});

describe('handlers.loadCard', () => {
  it('loadCard updates state and resolves new card', () => {
    expect(true).toBe(false);
  });
});