export interface IEventDispatcher {
  addEventListener(event: string, handler: any): void;
  removeEventListener(event: string, handler: any): void;
  removeAllListeners(event: string): void;
  dispatchAll(event: string): void;
  dispatchEvent(event: string, handler: any): void;
}
