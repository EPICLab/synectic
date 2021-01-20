/**
 * @deprecated This testing infrastructure file will be removed in upcoming commits, prior to any new releases being created from the 
 * `development` branch. Please use the new `reduxStoreMock.ts` implementation instead.
 */
import { DateTime } from 'luxon';
import { v4 } from 'uuid';
import parsePath from 'parse-path';

import { Canvas, Stack, Card, Filetype, Metafile, Repository } from '../../src/types';
import { createStore, CombinedState, Store } from 'redux';
import { rootReducer } from '../../src/store/root';
import { Action } from '../../src/store/actions';

type initStateT = {
  canvas: Canvas;
  stacks: { [id: string]: Stack };
  cards: { [id: string]: Card };
  filetypes: { [id: string]: Filetype };
  metafiles: { [id: string]: Metafile };
  repos: { [id: string]: Repository };
}

const validCanvasUUID = v4();
const validCardUUID = v4();
export const initialState: initStateT = {
  canvas: {
    id: validCanvasUUID,
    created: DateTime.fromISO('1991-12-26T08:00:00.000-08:00'),
    repos: ['13 '],
    cards: ['14', '33', validCardUUID],
    stacks: ['36']
  },
  stacks: {
    36: {
      id: '36',
      name: 'sample stack',
      created: DateTime.fromISO('2019-01-21T08:14:52.181-08:00'),
      modified: DateTime.fromISO('2019-11-19T19:22:47.572-08:00'),
      note: '',
      cards: [],
      left: 5,
      top: 5
    }
  },
  cards: {
    14: {
      id: '14',
      name: 'test.js',
      type: 'Editor',
      metafile: '243',
      created: DateTime.fromISO('2019-01-21T08:14:52.181-08:00'),
      modified: DateTime.fromISO('2019-11-19T19:22:47.572-08:00'),
      captured: false,
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
      captured: false,
      left: 27,
      top: 105
    },
    validCardUUID: {
      id: validCardUUID,
      name: 'example.ts',
      type: 'Editor',
      metafile: '199',
      created: DateTime.fromISO('2019-01-21T08:14:52.181-08:00'),
      modified: DateTime.fromISO('2019-11-19T19:22:47.572-08:00'),
      captured: false,
      left: 20,
      top: 40
    }
  },
  filetypes: {
    91: {
      id: '91',
      filetype: 'JavaScript',
      handler: 'Editor',
      extensions: ['js', 'jsm']
    },
    45: {
      id: '45',
      filetype: 'TypeScript',
      handler: 'Editor',
      extensions: ['ts', 'typescript', 'str']
    },
    99: {
      id: '99',
      filetype: 'Razor',
      handler: 'Editor',
      extensions: ['cshtml', 'asp']
    }
  },
  metafiles: {
    199: {
      id: '199',
      name: 'test.js',
      modified: DateTime.fromISO('2019-11-19T19:19:47.572-08:00'),
      content: 'const rand: number = Math.floor(Math.random() * 6) + 1;'
    },
    243: {
      id: '243',
      name: 'example.ts',
      modified: DateTime.fromISO('2015-06-19T19:10:47.572-08:00'),
      content: 'var rand = Math.floor(Math.random() * 6) + 1;'
    },
    459: {
      id: '243',
      name: 'turtle.asp',
      modified: DateTime.fromISO('1998-01-01T20:20:20.144-08:00'),
      content: 'Response.Write("Hello World!")'
    },
    99: {
      id: '99',
      name: 'testdir',
      path: 'withchildren/testdir',
      filetype: 'Directory',
      handler: 'Explorer',
      modified: DateTime.fromISO('2000-02-02T20:20:20.222-08:00'),
      contains: []
    },
    24: {
      id: '24',
      name: 'withchildren',
      path: 'withchildren',
      filetype: 'Directory',
      handler: 'Explorer',
      modified: DateTime.fromISO('2001-01-01T01:01:01.111-08:00'),
      contains: ['99', '199']
    },
    75: {
      id: '75',
      name: 'trackedDir',
      path: 'trackedDir',
      filetype: 'Directory',
      handler: 'Explorer',
      modified: DateTime.fromISO('2001-01-01T01:01:01.111-08:00'),
      branch: 'master',
      contains: []
    }
  },
  repos: {
    13: {
      id: '13',
      name: 'test/repo',
      root: '/',
      corsProxy: new URL('http://www.random_proxy.edu'),
      url: parsePath('http://www.random_proxy.edu'),
      local: ['master'],
      remote: [],
      oauth: 'github',
      username: 'sam',
      password: 'pass123',
      token: '934394304234231'
    }
  }
};

export const getMockStore = (): Store<CombinedState<initStateT>, Action> => createStore(rootReducer, initialState);

export const getCanvasProps = (): Canvas => initialState.canvas;

export const getCardProps = (index?: number): Card => {
  const initialCards = Object.values(initialState.cards);
  if (index && index >= 0 && index < initialCards.length) {
    return initialCards[index];
  }
  return initialCards[0];
};