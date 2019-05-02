import { Editor } from './editor/Editor';
import { OCR } from './ocr/OCR';
import { FileExplorer } from './fileexplorer/FileExplorer'

export interface ICardTypes {
  [key: string]: any;
}

export const cardTypes: ICardTypes = {
  Editor: Editor,
  OCR: OCR,
  FileExplorer: FileExplorer
};
