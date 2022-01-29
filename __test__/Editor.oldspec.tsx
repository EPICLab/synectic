import React from 'react';
import { Provider } from 'react-redux';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { virtualMetafile } from './__fixtures__/Metafile';
import { testStore } from './__fixtures__/ReduxStore';
import { mockStore } from './__mocks__/reduxStoreMock';
import Editor from '../src/components/Editor/Editor';

describe('Editor', () => {

  const store = mockStore(testStore);

  afterEach(() => {
    cleanup;
    jest.restoreAllMocks();
  });

  it('Editor renders in the DOM', () => {
    const { container } = render(
      <Provider store={store}>
        <Editor metafileId={virtualMetafile.id} />
      </Provider>
    );
    expect(container.querySelector('.ace_editor')).toBeInTheDocument();
  });

  it('Editor tracks content updates', () => {
    render(
      <Provider store={store}>
        <Editor metafileId={virtualMetafile.id} />
      </Provider>
    );
    const textBox = screen.queryByRole('textbox');
    expect(textBox).toHaveValue('');

    // update the content of the editor
    if (textBox) {
      fireEvent.focus(textBox);
      fireEvent.change(textBox, { target: { value: 'var foo = 5;' } });
    }

    expect(screen.queryByRole('textbox')).toHaveValue('var foo = 5;');
  });
});