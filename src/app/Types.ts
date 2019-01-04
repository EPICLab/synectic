import { Editor } from './editor/Editor';
import { OCR } from './ocr/OCR';

export interface ICardTypes {
  [key: string]: any;
}

export const cardTypes: ICardTypes = {
  Editor: Editor,
  OCR: OCR
};
