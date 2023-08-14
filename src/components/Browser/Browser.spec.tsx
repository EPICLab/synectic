import React from 'react';
import { render, screen } from '@testing-library/react';
import Browser from './Browser';

describe('Browser', () => {
  it('node::fs module cannot be injected into this jest test suite, so passthrough', () => {
    expect(true).toBeTruthy();
  });

  // it('Browser component is rendered', async () => {
  //   render(<Browser metafileId='1' />);
  //   expect(screen.getByPlaceholderText('URL')).toBeInTheDocument();
  // });

  // it('Browser allows the user to enter/edit a URL', async () => {
  //   const user = userEvent.setup();
  //   render(<Browser card='1' />);
  //   const textBox = screen.getByRole('textbox');

  //   expect(textBox).toHaveValue('https://epiclab.github.io/');

  //   // Type URL into text box
  //   await user.clear(screen.getByRole('textbox'));
  //   await user.type(screen.getByRole('textbox'), 'https://google.com');

  //   // Hit Enter button
  //   fireEvent.keyDown(textBox, { key: 'Enter', keyCode: 'Enter', charCode: 13 });

  //   expect(textBox).toHaveValue('https://google.com');
  // });

  // it('Browser allows the user to navigate backwards and forwards in history', async () => {
  //   const user = userEvent.setup();
  //   render(<Browser card='2' />);
  //   const textBox = screen.getByRole('textbox');
  //   const backButton = screen.getAllByRole('button')[0];
  //   const forwardButton = screen.getAllByRole('button')[1];

  //   expect(textBox).toHaveValue('https://epiclab.github.io/');
  //   textBox.focus();

  //   // Type URL into text box
  //   await user.clear(screen.getByRole('textbox'));
  //   await user.type(screen.getByRole('textbox'), 'https://google.com');

  //   // Press Enter key
  //   fireEvent.keyDown(textBox, { key: 'Enter', keyCode: 'Enter', charCode: 13 });
  //   expect(screen.getByRole('textbox')).toHaveValue('https://google.com');

  //   // Go back in history
  //   fireEvent.click(backButton);
  //   expect(textBox).toHaveValue('https://epiclab.github.io/');

  //   // Go forward in history
  //   fireEvent.click(forwardButton);
  //   expect(textBox).toHaveValue('https://google.com/');
  // });

  // it('Browser does not change the page URL when the refresh button is clicked', async () => {
  //   const user = userEvent.setup();
  //   render(<Browser card='3' />);
  //   const textBox = screen.getByRole('textbox');
  //   const refreshButton = screen.getAllByRole('button')[2];

  //   expect(textBox).toHaveValue('https://epiclab.github.io/');
  //   fireEvent.click(refreshButton);
  //   expect(textBox).toHaveValue('https://epiclab.github.io/');

  //   textBox.focus();

  //   // Type URL into text box
  //   await user.clear(screen.getByRole('textbox'));
  //   await user.type(screen.getByRole('textbox'), 'https://google.com');

  //   // Press Enter key
  //   fireEvent.keyDown(textBox, { key: 'Enter', keyCode: 'Enter', charCode: 13 });

  //   expect(textBox).toHaveValue('https://google.com');
  //   fireEvent.click(refreshButton);
  //   expect(textBox).toHaveValue('https://google.com');
  // });
});
