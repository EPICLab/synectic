// import { EventDispatcher } from 'ste-events';
//
// export class Clock {
//   private _onClockTick = new EventDispatcher<Clock, number>();
//   private _ticks: number = 0;
//   private _timeout: number;
//
//   constructor(public name: string, ms: number, timeout: number) {
//     this._timeout = timeout;
//     setInterval(() => {
//       this._ticks += 1;
//       if (this._ticks >= this._timeout) console.log('TIME EXCEEDED');
//       this._onClockTick.dispatch(this, this._ticks);
//     }, ms);
//   }
//
//   public get onClockTick() {
//     return this._onClockTick.asEvent();
//   }
// }
