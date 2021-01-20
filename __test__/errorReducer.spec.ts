import { Error } from '../src/types';
import { errorReducer } from '../src/store/reducers/errors';
import { ActionKeys } from '../src/store/actions';

describe('errorReducer', () => {
  const errors: { [id: string]: Error } = {
    '92': {
      id: '92',
      type: 'RepositoryMissingError',
      target: '23',
      message: 'Repository missing for metafile \'sampleUser/myRepo\''
    }
  }

  const newError: Error = {
    id: '94',
    type: 'HandlerMissingError',
    target: '19',
    message: 'Metafile \'sampleUser/myRepo\' missing handler to resolve filetype: \'TypeScript\''
  }

  it('errorReducer returns default state when current state is blank', () => {
    const newErrors = errorReducer(undefined, { type: ActionKeys.ADD_ERROR, id: newError.id, error: newError });
    expect(Object.keys(newErrors)).toHaveLength(1);
    expect(newErrors).toMatchSnapshot();
  });

  it('errorReducer appends a new error to state on action ADD_ERROR', () => {
    const addedErrors = errorReducer(errors, { type: ActionKeys.ADD_ERROR, id: newError.id, error: newError });
    expect(Object.keys(addedErrors)).toHaveLength(2);
    expect(addedErrors).toMatchSnapshot();
  });

  it('errorReducer removes an error from state on action REMOVE_ERROR', () => {
    const matchedErrors = errorReducer(errors, { type: ActionKeys.REMOVE_ERROR, id: '92' });
    expect(Object.keys(matchedErrors)).toHaveLength(0);
  });

  it('errorReducer resolves non-matching error in state on action REMOVE_ERROR', () => {
    const nonMatchedErrors = errorReducer(errors, { type: ActionKeys.REMOVE_ERROR, id: newError.id });
    expect(Object.keys(nonMatchedErrors)).toHaveLength(Object.keys(errors).length);
  });

});