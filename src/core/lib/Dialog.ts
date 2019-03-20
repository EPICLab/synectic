type dialogTypes = 'snackbar' | 'banner' | 'dialog';

export class Dialog {

  dialogType: dialogTypes;
  title?: HTMLSpanElement;
  closeButton: HTMLButtonElement = document.createElement('button');
  dialog: HTMLDivElement = document.createElement('div');
  top: HTMLDivElement = document.createElement('div');
  middle: HTMLDivElement = document.createElement('div');
  bottom: HTMLDivElement = document.createElement('div');
  overlay?: HTMLDivElement;

  constructor(dialogType: dialogTypes, title?: string, message?: string) {
    this.dialogType = dialogType;
    if (title) this.addTitle(title);
    this.closeButton.setAttribute('class', 'close');
    this.setupDefault();
    switch (this.dialogType) {
    case 'snackbar':
      if (!message) throw new Error('ERROR: Snackbar dialog requires the message parameter.');
      global.Synectic.current.element.appendChild(this.setupSnackbar(message));
      break;
    case 'banner':
      if (!message) throw new Error('ERROR: Banner dialog requires the message parameter.');
      global.Synectic.current.element.appendChild(this.setupBanner(message));
      break;
    case 'dialog':
      global.Synectic.current.element.appendChild(this.setupDialog());
      break;
    }
  }

  destructor() {
    if (this.overlay) {
      $(this.overlay).remove();
    } else {
      $(this.dialog).remove();
    }
  }

  addTitle(title: string) {
    if (this.title) {
      this.title.innerHTML = '<b>' + title + '</b>';
    } else {
      this.title = document.createElement('span');
      this.title.innerHTML = '<b>' + title + '</b>';
      this.top.appendChild(this.title);
    }
  }

  addContents(elements: HTMLElement[]) {
    elements.map(elem => this.middle.appendChild(elem));
  }

  addButtons(buttons: HTMLButtonElement[]) {
    buttons.map(button => this.bottom.appendChild(button));
  }

  private setupDefault() {
    this.top.setAttribute('class', 'top');
    this.middle.setAttribute('class', 'middle');
    this.bottom.setAttribute('class', 'bottom');
    this.dialog.appendChild(this.top);
    this.dialog.appendChild(this.middle);
    this.dialog.appendChild(this.bottom);
  }

  private setupSnackbar(message: string): HTMLDivElement {
    this.dialog.setAttribute('class', 'snackbar');
    const content = document.createElement('span');
    content.innerText = message;
    this.middle.appendChild(content);
    $(this.dialog).on('mouseenter', () => $(this.closeButton)
      .show()).on('mouseleave', () => $(this.closeButton).hide());
    $(this.closeButton).on('click', () => {
      console.log('Snackbar close button');
      $(this.dialog).toggle('fold', undefined, 500);
      setTimeout(() => this.destructor(), 550);
    });
    this.bottom.appendChild(this.closeButton);
    return this.dialog;
  }

  private setupBanner(message: string): HTMLDivElement {
    this.dialog.setAttribute('class', 'banner');
    const content = document.createElement('span');
    content.innerText = message;
    this.middle.appendChild(content);
    $(this.dialog).on('mouseenter', () => $(this.closeButton)
      .show()).on('mouseleave', () => $(this.closeButton).hide());
    $(this.closeButton).on('click', () => {
      console.log('Banner close button');
      $(this.dialog).toggle('fold', undefined, 500);
      setTimeout(() => this.destructor(), 550);
    });
    this.bottom.appendChild(this.closeButton);
    return this.dialog;
  }

  private setupDialog(): HTMLDivElement {
    this.overlay = document.createElement('div');
    this.overlay.setAttribute('class', 'overlay');
    this.overlay.appendChild(this.dialog);
    this.dialog.setAttribute('class', 'dialog');
    $(this.dialog).on('mouseenter', () => $(this.closeButton)
      .show()).on('mouseleave', () => $(this.closeButton).hide());
    $(this.closeButton).on('click', () => {
      console.log('Dialog close button');
      if (this.overlay) {
        $(this.overlay).toggle('fold', undefined, 500);
      }
      setTimeout(() => this.destructor(), 550);
    });
    this.top.appendChild(this.closeButton);
    return this.overlay;
  }

}
