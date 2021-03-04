import { v4 } from 'uuid';
import { DateTime } from 'luxon';
import { RootState } from '../../src/store/root';

export const basicStore: RootState = {
  canvas: {
    id: v4(),
    created: DateTime.fromISO('1991-12-26T08:00:00.000-08:00'),
    repos: [],
    cards: ['14', '33'],
    stacks: []
  },
  stacks: {},
  cards: {
    14: {
      id: '14',
      name: 'test.js',
      type: 'Editor',
      metafile: '243',
      created: DateTime.fromISO('2019-01-21T08:14:52.181-08:00'),
      modified: DateTime.fromISO('2019-11-19T19:22:47.572-08:00'),
      left: 10,
      top: 10
    },
    33: {
      id: '33',
      name: 'turtle.asp',
      type: 'Editor',
      metafile: '459',
      created: DateTime.fromISO('1997-12-27T10:10:10.288-08:00'),
      modified: DateTime.fromISO('1998-01-01T20:20:20.144-08:00'),
      left: 27,
      top: 105
    }
  },
  filetypes: {},
  metafiles: {},
  repos: {},
  modals: {
    '2d52bbae-d396-44a5-a91d-ec4cf3ab8a9b': {
      id: '2d52bbae-d396-44a5-a91d-ec4cf3ab8a9b',
      type: 'DiffPicker'
    }
  }
};