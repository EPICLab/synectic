import { DateTime } from 'luxon';
import { RootState } from '../../src/store/store';

// Note: All UUIDs are unique and were generated to pass 'validator/lib/isUUID'

export const emptyStore: RootState = {
  stacks: {
    ids: [],
    entities: {}
  },
  cards: {
    ids: [],
    entities: {}
  },
  filetypes: {
    ids: [],
    entities: {}
  },
  metafiles: {
    ids: [],
    entities: {}
  },
  cached: {
    ids: [],
    entities: {}
  },
  repos: {
    ids: [],
    entities: {}
  },
  branches: {
    ids: [],
    entities: {}
  },
  modals: {
    ids: [],
    entities: {}
  },
  // _persist: {
  //   version: 0,
  //   rehydrated: true
  // }
}

export const testStore: RootState = {
  stacks: {
    ids: ['254fa11a-6e7e-4fd3-bc08-e97c5409719b', '1942z532-e7ab-190a-d1d3-385a2295de62'],
    entities: {
      '254fa11a-6e7e-4fd3-bc08-e97c5409719b': {
        id: '254fa11a-6e7e-4fd3-bc08-e97c5409719b',
        name: 'testStack',
        created: DateTime.fromISO('2020-06-19T08:14:52.181-08:00').valueOf(),
        modified: DateTime.fromISO('2020-10-23T19:22:47.572-08:00').valueOf(),
        note: 'simple stack with two cards',
        cards: [
          'f6b3f2a3-9145-4b59-a4a1-bf414214f30b',
          '17734ae2-f8da-40cf-be86-993dc21b4079'
        ],
        left: 150,
        top: 200
      },
      '1942z532-e7ab-190a-d1d3-385a2295de62': {
        id: '1942z532-e7ab-190a-d1d3-385a2295de62',
        name: 'biggerStack',
        created: DateTime.fromISO('2020-06-19T08:14:52.181-08:00').valueOf(),
        modified: DateTime.fromISO('2020-10-23T19:22:47.572-08:00').valueOf(),
        note: 'simple stack with three cards',
        cards: [
          '6e84b210-f148-43bd-8364-c8710e70a9ef',
          '43c3c447-da0d-4299-a006-57344beb77da',
          '4efdbe23-c938-4eb1-b29b-50bf76bdb44e'
        ],
        left: 150,
        top: 200
      }
    }
  },
  cards: {
    ids: ['f6b3f2a3-9145-4b59-a4a1-bf414214f30b', '67406095-fd01-4441-8e52-b0fdbad3327a', '17734ae2-f8da-40cf-be86-993dc21b4079', '6e84b210-f148-43bd-8364-c8710e70a9ef', '43c3c447-da0d-4299-a006-57344beb77da', 'f1a1fb16-cb06-4fb7-9b10-29ad95032d51', '4efdbe23-c938-4eb1-b29b-50bf76bdb44e'],
    entities: {
      'f6b3f2a3-9145-4b59-a4a1-bf414214f30b': {
        id: 'f6b3f2a3-9145-4b59-a4a1-bf414214f30b',
        name: 'test.js',
        type: 'Editor',
        metafile: '46ae0111-0c82-4ee2-9ee5-cd5bdf8d8a71',
        created: DateTime.fromISO('2019-01-21T08:14:52.181-08:00').valueOf(),
        modified: DateTime.fromISO('2019-11-19T19:22:47.572-08:00').valueOf(),
        left: 10,
        top: 10,
        zIndex: 0,
        classes: [],
        captured: '254fa11a-6e7e-4fd3-bc08-e97c5409719b'
      },
      '67406095-fd01-4441-8e52-b0fdbad3327a': {
        id: '67406095-fd01-4441-8e52-b0fdbad3327a',
        name: 'turtle.asp',
        type: 'Editor',
        metafile: 'b859d4e8-b932-4fc7-a2f7-29a8ef8cd8f8',
        created: DateTime.fromISO('1997-12-27T10:10:10.288-08:00').valueOf(),
        modified: DateTime.fromISO('1998-01-01T20:20:20.144-08:00').valueOf(),
        left: 27,
        top: 105,
        zIndex: 0,
        classes: [],
      },
      '17734ae2-f8da-40cf-be86-993dc21b4079': {
        id: '17734ae2-f8da-40cf-be86-993dc21b4079',
        name: 'example.ts',
        type: 'Editor',
        metafile: '821c9159-292b-4639-b90e-e84fc12740ee',
        created: DateTime.fromISO('2019-01-21T08:14:52.181-08:00').valueOf(),
        modified: DateTime.fromISO('2019-11-19T19:22:47.572-08:00').valueOf(),
        left: 20,
        top: 40,
        zIndex: 0,
        classes: [],
        captured: '254fa11a-6e7e-4fd3-bc08-e97c5409719b'
      },
      '6e84b210-f148-43bd-8364-c8710e70a9ef': {
        id: '6e84b210-f148-43bd-8364-c8710e70a9ef',
        name: 'bar',
        type: 'Diff',
        metafile: '46ae0111-0c82-4ee2-9ee5-cd5bdf8d8a71',
        created: DateTime.fromISO('2019-01-21T08:14:52.181-08:00').valueOf(),
        modified: DateTime.fromISO('2019-11-19T19:22:47.572-08:00').valueOf(),
        left: 10,
        top: 10,
        zIndex: 0,
        classes: [],
        captured: '1942z532-e7ab-190a-d1d3-385a2295de62'
      },
      '43c3c447-da0d-4299-a006-57344beb77da': {
        id: '43c3c447-da0d-4299-a006-57344beb77da',
        name: 'foo',
        type: 'Explorer',
        metafile: '28',
        created: DateTime.fromISO('2019-01-21T08:14:52.181-08:00').valueOf(),
        modified: DateTime.fromISO('2019-11-19T19:22:47.572-08:00').valueOf(),
        left: 10,
        top: 10,
        zIndex: 0,
        classes: [],
        captured: '1942z532-e7ab-190a-d1d3-385a2295de62'
      },
      'f1a1fb16-cb06-4fb7-9b10-29ad95032d51': {
        id: 'f1a1fb16-cb06-4fb7-9b10-29ad95032d51',
        name: 'zap',
        type: 'Browser',
        metafile: '46ae0111-0c82-4ee2-9ee5-cd5bdf8d8a71',
        created: DateTime.fromISO('2019-01-21T08:14:52.181-08:00').valueOf(),
        modified: DateTime.fromISO('2019-11-19T19:22:47.572-08:00').valueOf(),
        left: 10,
        top: 10,
        zIndex: 0,
        classes: []
      },
      '4efdbe23-c938-4eb1-b29b-50bf76bdb44e': {
        id: '4efdbe23-c938-4eb1-b29b-50bf76bdb44e',
        name: 'baz',
        type: 'ReposTracker',
        metafile: '46ae0111-0c82-4ee2-9ee5-cd5bdf8d8a71',
        created: DateTime.fromISO('2019-01-21T08:14:52.181-08:00').valueOf(),
        modified: DateTime.fromISO('2019-11-19T19:22:47.572-08:00').valueOf(),
        left: 10,
        top: 10,
        zIndex: 0,
        classes: [],
        captured: '1942z532-e7ab-190a-d1d3-385a2295de62'
      }
    }
  },
  filetypes: {
    ids: ['eb5d332e-61a1-422d-aeba-48186d9f79f3'],
    entities: {
      'eb5d332e-61a1-422d-aeba-48186d9f79f3': {
        id: 'eb5d332e-61a1-422d-aeba-48186d9f79f3',
        filetype: 'JavaScript',
        handler: 'Editor',
        extensions: ['js', 'jsm']
      }
    }
  },
  metafiles: {
    ids: ['821c9159-292b-4639-b90e-e84fc12740ee', '46ae0111-0c82-4ee2-9ee5-cd5bdf8d8a71', '88e2gd50-3a5q-6401-b5b3-203c6710e35c', 'b859d4e8-b932-4fc7-a2f7-29a8ef8cd8f8', '28'],
    entities: {
      '821c9159-292b-4639-b90e-e84fc12740ee': {
        id: '821c9159-292b-4639-b90e-e84fc12740ee',
        name: 'test.js',
        modified: DateTime.fromISO('2019-11-19T19:19:47.572-08:00').valueOf(),
        content: 'var rand: number = Math.floor(Math.random() * 6) + 1;'
      },
      '46ae0111-0c82-4ee2-9ee5-cd5bdf8d8a71': {
        id: '46ae0111-0c82-4ee2-9ee5-cd5bdf8d8a71',
        name: 'example.ts',
        path: 'foo/example.ts',
        modified: DateTime.fromISO('2015-06-19T19:10:47.319-08:00').valueOf(),
        content: 'const rand = Math.floor(Math.random() * 6) + 1;',
        repo: '23',
        branch: 'master'
      },
      '88e2gd50-3a5q-6401-b5b3-203c6710e35c': {
        id: '88e2gd50-3a5q-6401-b5b3-203c6710e35c',
        name: 'bar.js',
        path: 'foo/bar.js',
        modified: DateTime.fromISO('2015-06-19T19:10:47.319-08:00').valueOf(),
        content: 'file contents',
      },
      'b859d4e8-b932-4fc7-a2f7-29a8ef8cd8f8': {
        id: 'b859d4e8-b932-4fc7-a2f7-29a8ef8cd8f8',
        name: 'turtle.asp',
        modified: DateTime.fromISO('2017-01-05T19:09:22.744-08:00').valueOf(),
      },
      '28': {
        id: '28',
        name: 'foo',
        path: 'foo',
        modified: DateTime.fromISO('2021-01-31T11:24:54.527-08:00').valueOf(),
        filetype: 'Directory',
        contains: ['46ae0111-0c82-4ee2-9ee5-cd5bdf8d8a71', '88e2gd50-3a5q-6401-b5b3-203c6710e35c']
      },
      'h8114d71-b100-fg9a-0c1d3516d991': {
        id: 'h8114d71-b100-fg9a-0c1d3516d991',
        name: 'virtual.js',
        handler: 'Editor',
        modified: DateTime.fromISO('2018-11-14T02:01:31.382-08:00').valueOf(),
        content: 'virtual file with content, but no file associated'
      }
    }
  },
  cached: {
    ids: [],
    entities: {}
  },
  repos: {
    ids: ['23'],
    entities: {
      '23': {
        id: '23',
        name: 'sampleUser/myRepo',
        root: 'sampleUser/',
        corsProxy: 'http://www.oregonstate.edu',
        url: 'https://github.com/sampleUser/myRepo',
        default: 'master',
        local: ['master', 'sample', 'test'],
        remote: [],
        oauth: 'github',
        username: 'sampleUser',
        password: '12345',
        token: '584n29dkj1683a67f302x009q164'
      }
    }
  },
  branches: {
    ids: [],
    entities: {}
  },
  modals: {
    ids: ['97fa02bc-596c-46d6-b025-2968f0d32b91', '2d52bbae-d396-44a5-a91d-ec4cf3ab8a9b', '8650d074-70b5-4eaa-a99e-a4f5eb825a60', '766d01f2-d4f5-4d13-99c0-6e1eba396079', '67f53785-4b14-46a8-8ffb-8fe0cad89bbd'],
    entities: {
      '97fa02bc-596c-46d6-b025-2968f0d32b91': {
        id: '97fa02bc-596c-46d6-b025-2968f0d32b91',
        type: 'NewCardDialog'
      },
      '2d52bbae-d396-44a5-a91d-ec4cf3ab8a9b': {
        id: '2d52bbae-d396-44a5-a91d-ec4cf3ab8a9b',
        type: 'DiffPicker'
      },
      '8650d074-70b5-4eaa-a99e-a4f5eb825a60': {
        id: '8650d074-70b5-4eaa-a99e-a4f5eb825a60',
        type: 'BranchList'
      },
      '766d01f2-d4f5-4d13-99c0-6e1eba396079': {
        id: '766d01f2-d4f5-4d13-99c0-6e1eba396079',
        type: 'MergeSelector'
      },
      '67f53785-4b14-46a8-8ffb-8fe0cad89bbd': {
        id: '67f53785-4b14-46a8-8ffb-8fe0cad89bbd',
        type: 'Error',
        subtype: 'LoadError',
        target: '43c3c447-da0d-4299-a006-57344beb77da',
        options: { message: 'Failed to load file.' }
      }
    }
  },
  // _persist: {
  //   version: 0,
  //   rehydrated: true
  // }
};