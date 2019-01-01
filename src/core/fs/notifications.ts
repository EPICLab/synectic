import { Canvas } from '../lib/Canvas';

/**
 * Creates a Snackbar notification that is non-interruptive, no user action required, and optionally user dismissed (eventual timeout, otherwise).
 * @param context The active Canvas instance for appending the Snackbar on top.
 * @param message The supporting HTML to be displayed in the Snackbar.
 * @param title (Optional) Title to be added to the top of the Snackbar.
*/
export function snackbar(context: Canvas, message: string, title?: string) {
  const snackbar = document.createElement('div');
  snackbar.setAttribute('class', 'snackbar');

  if (title) {
    const noticeTitle: HTMLSpanElement = document.createElement('span');
    noticeTitle.innerHTML = '<b>' + title + '</b>';
    snackbar.appendChild(noticeTitle);
  }

  const content = document.createElement('span');
  content.innerText = message;
  snackbar.appendChild(content);

  const closeButton = document.createElement('button');
  closeButton.setAttribute('class', 'close');
  $(snackbar).hover(() => $(closeButton).show(), () => $(closeButton).hide());
  $(closeButton).click(() => {
    $(snackbar).toggle('fold', undefined, 500);
    setTimeout(() => $(snackbar).remove(),550);
  });

  snackbar.appendChild(closeButton);
  setTimeout(() => $(snackbar).toggle('fold', undefined, 500), 6000);
  setTimeout(() => $(snackbar).remove(), 6550);

  context.element.appendChild(snackbar);
}

/**
 * Creates a Banner notification that is mildly-interruptive, user action is optional, and requires user dismissal.
 * @param context The active Canvas instance for appending the Banner on top.
 * @param message The supporting HTML to be displayed in the Banner.
 * @param title (Optional) Title to be added to the top of the Banner.
 * @param buttons (Optional) The list of strings for labeling buttons.
 * @param callback (Optional) Callback for handling button selection events.
*/
export function banner(context: Canvas, message: string, title?: string , buttons?: string[], callback?: (response: number, banner: HTMLDivElement) => any) {
  const banner = document.createElement('div');
  banner.setAttribute('class', 'banner');

  if (title) {
    const noticeTitle: HTMLSpanElement = document.createElement('span');
    noticeTitle.innerHTML = '<b>' + title + '</b>';
    banner.appendChild(noticeTitle);
  }

  const content = document.createElement('span');
  content.innerText = message;
  banner.appendChild(content);

  if (buttons) {
    buttons.map((text, index) => {
      let button = document.createElement('button');
      button.innerHTML = text;
      if (callback) {
        $(button).click(() => callback(index, banner));
      }
      banner.appendChild(button);
    });
  }

  const closeButton = document.createElement('button');
  closeButton.setAttribute('class', 'close');
  $(banner).hover(() => $(closeButton).show(), () => $(closeButton).hide());
  $(closeButton).click(() => {
    $(banner).toggle('fold', undefined, 500);
    setTimeout(() => $(banner).remove(),550);
  });
  banner.appendChild(closeButton);

  context.element.appendChild(banner);
}

/**
 * Creates a Dialog notification that is highly interruptive, user action required, and requires user dismissal.
 * @param context The active Canvas instance for appending the Dialog on top.
 * @param content The list of content HTML elements to be added in-order to the Dialog.
 * @param title (Optional) Title to be added to the top of the Dialog.
 * @param buttons (Optional) The list of strings for labeling buttons.
 * @param callback (Optional) Callback for handling button selection events.
*/
export function dialog(context: Canvas, content: HTMLElement[], title?: string, buttons?: string[], callback?: (response: number, dialog: HTMLDivElement) => any) {
  const overlay = document.createElement('div');
  overlay.setAttribute('class', 'overlay');
  const dialog = document.createElement('div');
  dialog.setAttribute('class', 'dialog');

  const top = document.createElement('div');
  top.setAttribute('class', 'top');
  if (title) {
    const noticeTitle = document.createElement('span');
    noticeTitle.innerHTML = '<b>' + title + '</b>';
    top.appendChild(noticeTitle);
  }
  dialog.appendChild(top);

  const middle = document.createElement('div');
  middle.setAttribute('class', 'middle');
  content.map((elem) => middle.appendChild(elem));
  dialog.appendChild(middle);

  const bottom = document.createElement('div');
  bottom.setAttribute('class', 'bottom');
  if (buttons) {
    buttons.map((text, index) => {
      let button = document.createElement('button');
      button.innerHTML = text;
      if (callback) {
        $(button).click(() => callback(index, overlay));
      }
      bottom.appendChild(button);
    });
  }
  dialog.appendChild(bottom);

  overlay.appendChild(dialog);
  context.element.appendChild(overlay);
}
