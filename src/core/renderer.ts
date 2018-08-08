import { AppManagerInstance } from './lib/AppManager';
import '../asset/style/canvas.css';
import '../asset/style/card.css';
import '../asset/style/stack.css';

import { Editor } from '../app/editor/Editor';
import { openCardDialog } from './fs/fileUI';
import * as fio from './fs/io';
import { jsonToMap } from './fs/mapper';
// import { typehandlers } from './fs/typehandlers';

global.Synectic = AppManagerInstance;

const c = global.Synectic.newCanvas();

const loadCardButton = document.createElement('button');
loadCardButton.innerText = 'Open...';
loadCardButton.onclick = () => openCardDialog({});
c.element.appendChild(loadCardButton);

const newEditorButton = document.createElement('button');
newEditorButton.innerText = 'New Editor';
newEditorButton.onclick = () => new Editor(c);
c.element.appendChild(newEditorButton);

const newTestingButton = document.createElement('button');
newTestingButton.innerText = 'Test JSON';
newTestingButton.onclick = () => {
  // fio.asyncWriteFile('handlers.json', fio.mapToJson(typehandlers));
  let tmp: Map<string, string>;
  fio.asyncReadFile('src/core/fs/handlers.json').then((res: string | void) => {
    if (res === undefined) throw new Error('File cannot be read!');
    tmp = jsonToMap(res);
    console.log('tmp: ' + tmp.get('JavaScript'));
  });
};
c.element.appendChild(newTestingButton);
