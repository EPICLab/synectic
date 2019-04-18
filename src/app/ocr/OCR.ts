import { Card } from '../../core/lib/Card';
import { Canvas } from '../../core/lib/Canvas';
import { Stack } from '../../core/lib/Stack';
import { addClass } from '../../core/lib/helper';
import { PathLike } from 'fs-extra';
// import 'ocrad.js';

export class OCR extends Card {
  public output: HTMLDivElement;
  public canvas: HTMLCanvasElement;

  constructor(parent: Canvas | Stack, filename: string) {
    super(parent, filename);

    this.output = document.createElement('div');
    this.output.setAttribute('id', (this.uuid + '-ocr'));
    addClass(this.element, 'ocr');
    $(this.output).css({
      width: '100%',
      height: '100%'
    });
    this.canvas = document.createElement('canvas');
  }

  load(filepath: PathLike): void {
    console.log(filepath);
    throw new Error("Method not implemented.");
  }

  save(): void {
    throw new Error("Method not implemented.");
  }

}
