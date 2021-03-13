import React from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { Provider } from 'react-redux';

import Editor from '../src/components/Editor';
import { mockStore } from './__mocks__/reduxStoreMock';
import { testStore } from './__fixtures__/ReduxStore';
import { virtualMetafile } from './__fixtures__/Metafile';

const store = mockStore(testStore);

describe('Editor', () => {

  afterEach(() => {
    cleanup;
    jest.resetAllMocks();
  });

  it('Editor renders correctly', () => {
    const { container } = render(
      <Provider store={store}>
        <Editor metafileId={virtualMetafile.id} />
      </Provider>
    );
    // using DOM selector method instead of RTL
    expect(container.querySelector('.ace_editor')).toBeInTheDocument();
  });

  it('Editor tracks content updates', () => {
    const { queryByRole } = render(
      <Provider store={store}>
        <Editor metafileId={virtualMetafile.id} />
      </Provider>
    );
    const textBox = queryByRole('textbox');
    expect(textBox).toHaveValue('');

    // update the content of the editor
    if (textBox) {
      fireEvent.focus(textBox);
      fireEvent.change(textBox, { target: { value: 'var foo = 5;' } });
    }

    expect(queryByRole('textbox')).toHaveValue('var foo = 5;');
  });

});