import parsePath from 'parse-path';
import { v4 } from 'uuid';
import { DateTime } from 'luxon';
import * as isogit from 'isomorphic-git';

import { mockStore } from './__mocks__/reduxStoreMock';
import { ActionKeys } from '../src/store/actions';
import * as repos from '../src/containers/repos';
import * as git from '../src/containers/git';
import * as metafiles from '../src/containers/metafiles';

describe('repos.updateBranches', () => {
  const store = mockStore({
    canvas: {
      id: v4(),
      created: DateTime.fromISO('1991-12-26T08:00:00.000-08:00'),
      repos: ['23'],
      cards: [],
      stacks: []
    },
    stacks: {},
    cards: {},
    filetypes: {},
    metafiles: {},
    repos: {
      23: {
        id: '23',
        name: 'sampleUser/myRepo',
        root: 'sampleUser/',
        corsProxy: new URL('http://www.oregonstate.edu'),
        url: parsePath('https://github.com/sampleUser/myRepo'),
        local: ['master', 'sample', 'test'],
        remote: [],
        oauth: 'github',
        username: 'sampleUser',
        password: '12345',
        token: '584n29dkj1683a67f302x009q164'
      }
    },
    errors: {}
  });

  afterEach(() => {
    store.clearActions();
    jest.clearAllMocks();
  });

  it('updateBranches resolves updates to local and remote branches for existing repo', async () => {
    const { local, remote } = { local: ['sample', 'master'], remote: ['sample', 'master', 'dev', 'bugfix'] };
    jest.spyOn(isogit, 'listBranches')
      .mockResolvedValue([])
      .mockResolvedValueOnce(local)
      .mockResolvedValueOnce(remote);

    await store.dispatch(repos.updateBranches('23'));
    return expect(store.getActions()).toEqual([
      expect.objectContaining({
        type: ActionKeys.UPDATE_REPO,
        repo: expect.objectContaining({
          id: '23',
          local: expect.arrayContaining<string>(local),
          remote: expect.arrayContaining<string>(remote)
        })
      })
    ]);
  });

  it('updateBranches resolves to error on UUID with no match in the Redux store', async () => {
    await store.dispatch(repos.updateBranches('9'));
    expect(store.getActions()).toEqual([
      expect.objectContaining({
        type: ActionKeys.ADD_ERROR,
        error: expect.objectContaining({ type: 'ReposError' })
      })
    ]);
  });
});

describe('repos.checkoutBranch', () => {
  const store = mockStore({
    canvas: {
      id: v4(),
      created: DateTime.fromISO('1991-12-26T08:00:00.000-08:00'),
      repos: ['23'],
      cards: ['36'],
      stacks: []
    },
    stacks: {},
    cards: {
      36: {
        id: '36',
        name: 'bar.js',
        created: DateTime.fromISO('2010-01-15T11:19:23.810-08:00'),
        modified: DateTime.fromISO('2010-01-15T11:19:23.810-08:00'),
        captured: false,
        left: 10,
        top: 25,
        type: 'Editor',
        metafile: '3'
      }
    },
    filetypes: {},
    metafiles: {
      3: {
        id: '3',
        name: 'bar.js',
        path: 'foo/bar.js',
        modified: DateTime.fromISO('2010-01-15T11:19:23.810-08:00'),
        repo: '23',
        branch: 'master'
      }
    },
    repos: {
      23: {
        id: '23',
        name: 'sampleUser/myRepo',
        root: 'sampleUser/',
        corsProxy: new URL('http://www.oregonstate.edu'),
        url: parsePath('https://github.com/sampleUser/myRepo'),
        local: ['master', 'sample', 'test'],
        remote: [],
        oauth: 'github',
        username: 'sampleUser',
        password: '12345',
        token: '584n29dkj1683a67f302x009q164'
      }
    },
    errors: {}
  });

  beforeAll(() => {
    jest.spyOn(isogit, 'checkout').mockResolvedValue();
    jest.spyOn(git, 'currentBranch').mockResolvedValue('sample');
    jest.spyOn(metafiles, 'getMetafile').mockImplementation(() => () => {
      return new Promise((resolve) => resolve({
        id: '7',
        name: 'bar.js',
        path: 'foo/bar.js',
        modified: DateTime.fromISO('2010-01-15T11:19:23.810-08:00'),
        repo: '23',
        branch: 'sample'
      }))
    });
  });
  afterEach(store.clearActions);
  afterAll(jest.clearAllMocks);

  it('checkoutBranch resolves a new branch metafile and updates the existing card', async () => {
    await store.dispatch(repos.checkoutBranch('36', '3', 'sample'));
    expect(store.getActions()).toEqual([
      expect.objectContaining({
        type: ActionKeys.UPDATE_CARD,
        card: expect.objectContaining({
          id: '36',
          name: 'bar.js',
          type: 'Editor',
          metafile: '7'
        })
      })
    ]);
  });

  it('checkoutBranch resolves to error on card UUID with no match in the Redux store', async () => {
    await store.dispatch(repos.checkoutBranch('41', '3', 'sample'));
    expect(store.getActions()).toEqual([
      expect.objectContaining({
        type: ActionKeys.ADD_ERROR,
        error: expect.objectContaining({ type: 'ReposError' })
      })
    ]);
  });

  it('checkoutBranch resolves to error on metafile UUID with no match in the Redux store', async () => {
    await store.dispatch(repos.checkoutBranch('36', '9', 'sample'));
    expect(store.getActions()).toEqual([
      expect.objectContaining({
        type: ActionKeys.ADD_ERROR,
        error: expect.objectContaining({ type: 'ReposError' })
      })
    ]);
  });
});

describe('repos.getRepository', () => {
  const store = mockStore({
    canvas: {
      id: v4(),
      created: DateTime.fromISO('1991-12-26T08:00:00.000-08:00'),
      repos: ['23'],
      cards: ['36'],
      stacks: []
    },
    stacks: {},
    cards: {
      36: {
        id: '36',
        name: 'bar.js',
        created: DateTime.fromISO('2010-01-15T11:19:23.810-08:00'),
        modified: DateTime.fromISO('2010-01-15T11:19:23.810-08:00'),
        captured: false,
        left: 10,
        top: 25,
        type: 'Editor',
        metafile: '3'
      }
    },
    filetypes: {},
    metafiles: {
      3: {
        id: '3',
        name: 'bar.js',
        path: 'foo/bar.js',
        modified: DateTime.fromISO('2010-01-15T11:19:23.810-08:00'),
        repo: '23',
        branch: 'master'
      }
    },
    repos: {
      23: {
        id: '23',
        name: 'sampleUser/myRepo',
        root: 'sampleUser/',
        corsProxy: new URL('http://www.oregonstate.edu'),
        url: parsePath('https://github.com/sampleUser/myRepo'),
        local: ['master', 'sample', 'test'],
        remote: [],
        oauth: 'github',
        username: 'sampleUser',
        password: '12345',
        token: '584n29dkj1683a67f302x009q164'
      }
    },
    errors: {}
  });

  afterEach(() => {
    store.clearActions();
    jest.clearAllMocks();
  });

  it('getRepository resolves to adding and updating a repository when no repository exists', async () => {
    jest.spyOn(git, 'getRepoRoot').mockResolvedValue('foo/');
    jest.spyOn(isogit, 'getConfigAll').mockResolvedValue(['https://github.com/sampleUser/SecondRepo']);
    jest.spyOn(isogit, 'getConfig')
      .mockResolvedValue([])
      .mockResolvedValueOnce(['sampleUser'])
      .mockResolvedValueOnce(['12345']);

    await store.dispatch(repos.getRepository('foo/bar.js'));
    return expect(store.getActions()).toEqual([
      expect.objectContaining({ type: ActionKeys.ADD_REPO }),
      expect.objectContaining({ type: ActionKeys.UPDATE_REPO })
    ]);
  });

  it('getRepository resolves to update branches on existing repository', async () => {
    jest.spyOn(git, 'getRepoRoot').mockResolvedValue('foo/');
    jest.spyOn(isogit, 'getConfigAll').mockResolvedValue(['https://github.com/sampleUser/myRepo']);

    await store.dispatch(repos.getRepository('foo/bar.js'));
    expect(store.getActions()).toEqual([
      expect.objectContaining({
        type: ActionKeys.UPDATE_REPO,
        repo: expect.objectContaining({
          id: '23',
          name: 'sampleUser/myRepo',
          url: expect.objectContaining({ href: 'https://github.com/sampleUser/myRepo' })
        })
      })
    ]);
  });

  it('getRepository resolves to undefined on paths not under version control', async () => {
    jest.spyOn(git, 'getRepoRoot').mockResolvedValue(undefined);
    return expect(store.dispatch(repos.getRepository('foo/bar.js'))).resolves.toBeUndefined();
  });
});