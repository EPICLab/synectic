interface IFileTypeDispatcher {
  addEventListener(event: string, handler: any): void;
  removeEventListener(event: string, handler: any): void;
  removeAllListeners(event: string): void;
  dispatchAll(event: string): void;
  dispatchEvent(event: string, handler: any): void;
}

export class FileTypeDispatcher implements IFileTypeDispatcher {
  private _eventHandlers: any = {};

  addEventListener(event: string, handler: any): void {
    this._eventHandlers[event] = this._eventHandlers[event] || [];
    this._eventHandlers[event].push(handler);
    console.log('addEventListener: event[' + event + '], handler[' + handler + ']');
  }

  removeEventListener(event: string, handler: any): void {
    console.log('removeEventListener: event[' + event + '], handler[' + handler + ']');
    this._eventHandlers.splice(this._eventHandlers.indexOf(event), 1);
  }

  removeAllListeners(event: string): void {
    console.log('removeAllListeners: event[' + event + ']');
  }

  dispatchAll(event: string): void {
    const handlers = this._eventHandlers[event];
    for (const handler of handlers) {
      this.dispatchEvent(event, handler);
    }
  }

  dispatchEvent(event: string, handler: any): void {
    handler(event);
  }
}
