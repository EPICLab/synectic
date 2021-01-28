import type { Filetype } from '../src/types';
import { filetypeReducer } from '../src/store/reducers/filetypes';
import { ActionKeys } from '../src/store/actions';

describe('filetypeReducer', () => {
  const filetypes: { [id: string]: Filetype } = {
    '67': {
      id: '67',
      filetype: 'Python',
      handler: 'Editor',
      extensions: ['py']
    }
  }

  const newFiletype: Filetype = {
    id: '55',
    filetype: 'JavaScript',
    handler: 'Editor',
    extensions: ['js', 'jsm']
  }

  it('filetypeReducer returns default state when current state is blank', () => {
    const newFiletypes = filetypeReducer(undefined, { type: ActionKeys.ADD_FILETYPE, id: newFiletype.id, filetype: newFiletype });
    expect(Object.keys(newFiletypes)).toHaveLength(1);
    expect(newFiletypes).toMatchSnapshot();
  });

  it('filetypeReducer appends a new filetype to state on action ADD_FILETYPE', () => {
    const newFiletypes = filetypeReducer(filetypes, { type: ActionKeys.ADD_FILETYPE, id: newFiletype.id, filetype: newFiletype });
    expect(Object.keys(newFiletypes)).toHaveLength(2);
    expect(newFiletypes).toMatchSnapshot();
  });

  it('filetypeReducer removes a filetype from state on action REMOVE_FILETYPE', () => {
    const matchedFiletypes = filetypeReducer(filetypes, { type: ActionKeys.REMOVE_FILETYPE, id: '67' });
    expect(Object.keys(matchedFiletypes)).toHaveLength(0);
  });

  it('filetypeReducer resolves non-matching filetype in state on action REMOVE_FILETYPE', () => {
    const nonMatchedFiletypes = filetypeReducer(filetypes, { type: ActionKeys.REMOVE_FILETYPE, id: newFiletype.id });
    expect(Object.keys(nonMatchedFiletypes)).toHaveLength(Object.keys(filetypes).length);
  });

  it('filetypeReducer updates state of matched filetype on action UPDATE_FILETYPE', () => {
    const targetFiletype = filetypes['67'];
    const updatedFiletypes = filetypeReducer(filetypes, {
      type: ActionKeys.UPDATE_FILETYPE, id: targetFiletype.id, filetype: {
        extensions: [...targetFiletype.extensions, 'pym']
      }
    });
    expect(updatedFiletypes).not.toMatchObject(filetypes);
    expect(updatedFiletypes).toMatchSnapshot();
  });
})