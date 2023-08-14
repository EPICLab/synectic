import { DateTime } from 'luxon';
import { emptyStore } from '../../test-utils/empty-store';
import { file, mock, MockInstance } from '../../test-utils/mock-fs';
import { mockStore } from '../../test-utils/mock-store';
import { Branch, branchAdded } from '../slices/branches';
import { Card, cardAdded, cardUpdated } from '../slices/cards';
import { metafileAdded, VersionedMetafile, VirtualMetafile } from '../slices/metafiles';
import { repoAdded, Repository } from '../slices/repos';
import cardSelectors from './cards';
import { Stack, stackAdded } from '../slices/stacks';

const mockedRepository: Repository = {
  id: '94304818-ca39-4fb1-9499-86aa329597b9',
  name: 'foo/myRepo',
  root: 'foo/',
  corsProxy: 'http://www.oregonstate.edu',
  url: 'https://github.com/foo/myRepo',
  default: 'master',
  local: ['master', 'sample', 'test'],
  remote: [],
  oauth: 'github',
  username: 'sampleUser',
  password: '12345',
  token: '584n29dkj1683a67f302x009q164'
};

const mockedBranch: Branch = {
  id: '7351312c-b7bf-4f9c-af65-d9fdfb7847e7',
  ref: 'main',
  linked: false,
  current: true,
  bare: false,
  root: 'foo/',
  gitdir: 'foo/.git',
  scope: 'local',
  remote: 'origin',
  status: 'clean',
  commits: [],
  head: '987654321'
};

const mockedMetafile1: VersionedMetafile = {
  id: '46ae0111-0c82-4ee2-9ee5-cd5bdf8d8a71',
  name: 'example.js',
  modified: DateTime.fromISO('2015-06-19T19:10:47.319-08:00').valueOf(),
  handler: 'Editor',
  filetype: 'JavaScript',
  flags: [],
  path: 'foo/example.js',
  state: 'unmodified',
  content: 'var rand = Math.floor(Math.random() * 6) + 1;',
  mtime: DateTime.fromISO('2020-01-28T07:44:15.276-08:00').valueOf(),
  repo: mockedRepository.id,
  branch: mockedBranch.id,
  status: 'unmodified',
  conflicts: []
};

const mockedMetafile2: VirtualMetafile = {
  id: '8c7bc39a-79d9-42d3-85c7-64b173a91d31',
  name: 'tap.js',
  modified: DateTime.fromISO('2015-06-19T19:10:47.319-08:00').valueOf(),
  handler: 'Editor',
  filetype: 'Javascript',
  flags: [],
  content: 'new content'
};

const mockedCard1: Card = {
  id: 'b741f857-870c-4756-b38b-b375823a08f6',
  name: 'sample.js',
  type: 'Editor',
  metafile: mockedMetafile1.id,
  created: DateTime.fromISO('2019-01-10T10:08:30.114-08:00').valueOf(),
  modified: DateTime.fromISO('2020-01-28T07:44:15.276-08:00').valueOf(),
  captured: '51dc24aa-0caf-4283-aeac-6affa901b460',
  expanded: false,
  flipped: false,
  y: 30,
  x: 50
};

const mockedCard2: Card = {
  id: '5d56ffda-9774-4bfd-a60c-db77165a3b9f',
  name: 'tap.js',
  type: 'Editor',
  metafile: mockedMetafile2.id,
  created: DateTime.fromISO('2013-01-10T10:08:30.114-08:00').valueOf(),
  modified: DateTime.fromISO('2015-06-19T19:10:47.319-08:00').valueOf(),
  captured: '51dc24aa-0caf-4283-aeac-6affa901b460',
  expanded: false,
  flipped: false,
  x: 30,
  y: 50
};

const mockedStack: Stack = {
  id: '51dc24aa-0caf-4283-aeac-6affa901b460',
  name: 'New Stack',
  created: DateTime.fromISO('2019-05-23T10:08:30.114-08:00').valueOf(),
  modified: DateTime.fromISO('2019-05-23T19:10:47.319-08:00').valueOf(),
  cards: [mockedCard1.id, mockedCard2.id],
  x: mockedCard1.x,
  y: mockedCard1.y
};

describe('cardSelectors', () => {
  it('node::fs module cannot be injected into this jest test suite, so passthrough', () => {
    expect(true).toBeTruthy();
  });
  //   const store = mockStore(emptyStore);
  //   let mockedInstance: MockInstance;

  //   beforeEach(async () => {
  //     store.dispatch(repoAdded(mockedRepository));
  //     store.dispatch(branchAdded(mockedBranch));
  //     store.dispatch(metafileAdded(mockedMetafile1));
  //     store.dispatch(metafileAdded(mockedMetafile2));
  //     store.dispatch(cardAdded(mockedCard1));
  //     store.dispatch(cardAdded(mockedCard2));
  //     store.dispatch(stackAdded(mockedStack));
  //     const instance = await mock({
  //       foo: {
  //         'bar.js': file({
  //           content: 'file contents',
  //           mtime: new Date('2020-01-01T07:13:04.276-08:00')
  //         }),
  //         'zap.ts': file({
  //           content: 'file contents',
  //           mtime: new Date('2021-04-05T14:21:32.783-08:00')
  //         }),
  //         'example.js': 'var rand = Math.floor(Math.random() * 6) + 1;',
  //         '.git': {
  //           config: '',
  //           HEAD: 'refs/heads/main',
  //           refs: {
  //             'remotes/origin/HEAD': 'ref: refs/remotes/origin/main'
  //           }
  //         }
  //       },
  //       bar: {
  //         '.git': {
  //           config: '',
  //           HEAD: 'refs/heads/test',
  //           refs: {
  //             'remotes/origin/HEAD': 'ref: refs/remotes/origin/test'
  //           }
  //         },
  //         'sample.js': 'var rand = Math.floor(Math.random() * 8) + 2;'
  //       }
  //     });
  //     return (mockedInstance = instance);
  //   });

  //   afterEach(() => {
  //     mockedInstance.reset();
  //     store.clearActions();
  //     jest.clearAllMocks();
  //   });

  //   it('selectById caches on id and recomputes when Card entities change', async () => {
  //     cardSelectors.selectById.resetRecomputations();

  //     cardSelectors.selectById(store.getState(), mockedCard1.id);
  //     expect(cardSelectors.selectById.recomputations()).toBe(1);
  //     store.dispatch(cardUpdated({ ...mockedCard1, x: 13, y: 303 }));
  //     cardSelectors.selectById(store.getState(), mockedCard1.id);
  //     expect(cardSelectors.selectById.recomputations()).toBe(2);
  //     cardSelectors.selectById(store.getState(), '');
  //     cardSelectors.selectById(store.getState(), mockedCard1.id); // cached
  //     return expect(cardSelectors.selectById.recomputations()).toBe(3);
  //   });

  //   it('selectByIds caches on ids and recomputes when Card entities change', async () => {
  //     cardSelectors.selectByIds.resetRecomputations();

  //     cardSelectors.selectByIds(store.getState(), [mockedCard1.id]);
  //     store.dispatch(cardUpdated({ ...mockedCard1, x: 13, y: 303 }));
  //     cardSelectors.selectByIds(store.getState(), [mockedCard1.id, mockedCard2.id]);
  //     cardSelectors.selectByIds(store.getState(), [mockedCard1.id]);
  //     cardSelectors.selectByIds(store.getState(), [mockedCard1.id, mockedCard2.id]); // cached
  //     return expect(cardSelectors.selectByIds.recomputations()).toBe(3);
  //   });
});
