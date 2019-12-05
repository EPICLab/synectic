import { DateTime } from 'luxon';

import { Stack } from '../src/store/types';
import { ActionKeys } from '../src/store/actions';
import { stackReducer } from '../src/store/reducers/stacks';

describe('stackReducer', () => {
  const stacks: { [id: string]: Stack } = {
    '141': {
      id: '141',
      name: 'testStack',
      created: DateTime.fromISO('2019-11-19T19:22:47.572-08:00'),
      modified: DateTime.fromISO('2019-11-19T19:22:47.572-08:00'),
      note: 'This stack has all of my important API documentation.',
      cards: ['32', '14'],
      left: 16,
      top: 21
    }
  }

  const newStack: Stack = {
    id: '2',
    name: 'stack',
    created: DateTime.fromISO('2016-01-25T11:38:11.720-08:00'),
    modified: DateTime.fromISO('2016-01-27T19:05:09.845-08:00'),
    note: 'This stack contains very important cards for Project X',
    cards: [], left: 78, top: 13
  }

  it('stackReducer appends a new stack to state on action ADD_STACK', () => {
    const addedStacks = stackReducer(stacks, { type: ActionKeys.ADD_STACK, id: newStack.id, stack: newStack });
    expect(Object.keys(stacks)).toHaveLength(1);
    expect(Object.keys(addedStacks)).toHaveLength(2);
  });

  it('stackReducer removes a stack from state on action REMOVE_STACK', () => {
    const matchedStacks = stackReducer(stacks, { type: ActionKeys.REMOVE_STACK, id: '141' });
    expect(Object.keys(matchedStacks)).toHaveLength(0);
  });

  it('stackReducer resolves non-matching stack in state on action REMOVE_STACK', () => {
    const nonMatchedStacks = stackReducer(stacks, { type: ActionKeys.REMOVE_STACK, id: '99' });
    expect(Object.keys(nonMatchedStacks)).toHaveLength(Object.keys(stacks).length);
  });

  it('stackReducer updates state of matched stack on action UPDATE_STACK', () => {
    const updatedStacks = stackReducer(stacks, {
      type: ActionKeys.UPDATE_STACK, id: '141', stack: {
        name: 'subtestStack',
        note: 'A subset of our favorite API doc blocks.'
      }
    });
    expect(updatedStacks).not.toMatchObject(stacks);
    expect(updatedStacks).toMatchSnapshot();
  });
});