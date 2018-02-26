import { Card } from "../core/Card";
import { Canvas } from "../core/Canvas";
import { Stack } from "../core/Stack";
import 'ocrad.js';
import { addClass } from '../core/helper';

export class OCR extends Card {

  public output: HTMLDivElement;
  public canvas: HTMLCanvasElement;

  constructor(parent: Canvas | Stack) {
    super(parent, ['ocr']);

    this.output = document.createElement('div');
    this.output.setAttribute('id', (this.uuid + '-ocr'));
    addClass(this.element, 'ocr');
    $(this.output).css({
      width: '100%',
      height: '100%'
    });
    this.canvas = document.createElement('canvas');
  }

}
