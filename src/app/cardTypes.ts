import { Editor } from './editor/Editor';
import { TextView } from './textview/TextView';

export interface ICardTypes {
  [key:string] : any;
}

export const cardTypes: ICardTypes = {
  Editor: Editor,
  TextView: TextView
}
