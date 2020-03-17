import { DateTime } from 'luxon';
import { v4 } from 'uuid';
import parsePath from 'parse-path';

import { Canvas, Stack, Card, Filetype, Metafile, Repository, Metadir } from '../../src/types';
import { createStore } from 'redux';
import { rootReducer } from '../../src/store/root';

type initStateT = {
  canvas: Canvas;
  stacks: { [id: string]: Stack };
  cards: { [id: string]: Card };
  filetypes: { [id: string]: Filetype };
  metafiles: { [id: string]: Metafile };
  repos: { [id: string]: Repository };
  metadirs: { [id: string]: Metadir };
}

const validCanvasUUID = v4();
const validCardUUID = v4();
const initialState: initStateT = {
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
      related: ['243'],
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
      related: ['459'],
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
      related: ['199'],
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
    }
  },
  repos: {
    13: {
      id: '13',
      name: 'test/repo',
      corsProxy: new URL('http://www.random_proxy.edu'),
      url: parsePath('http://www.random_proxy.edu'),
      refs: ['master'],
      oauth: 'github',
      username: 'sam',
      password: 'pass123',
      token: '934394304234231'
    }
  },
  metadirs: {
    99: {
      id: '99',
      name: 'testdir',
      path: 'withchildren/testdir',
      containsDir: [],
      containsFile: []
    },
    24: {
      id: '24',
      name: 'withchildren',
      path: 'withchildren',
      containsDir: ["withchildren/testdir"],
      containsFile: ['withchildren/test']
    }
  }
};

export const getMockStore = () => createStore(rootReducer, initialState);

export const getCanvasProps = () => initialState.canvas;

export const getCardProps = (index?: number) => {
  const initialCards = Object.values(initialState.cards);
  if (index && index >= 0 && index < initialCards.length) {
    return initialCards[index];
  }
  return initialCards[0];
};