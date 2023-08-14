import { DateTime } from 'luxon';
import { delay } from '../../containers/utils';
import { emptyStore } from '../../test-utils/empty-store';
import { file, mock, MockInstance } from '../../test-utils/mock-fs';
import { mockStore } from '../../test-utils/mock-store';
import { Branch, branchAdded } from '../slices/branches';
import { Filetype, filetypeAdded } from '../slices/filetypes';
import {
  VersionedMetafile,
  metafileAdded,
  metafileUpdated,
  metafilesUpdated
} from '../slices/metafiles';
import { repoAdded, Repository } from '../slices/repos';
import { fetchMetafile } from '../thunks/metafiles';
import metafileSelectors from './metafiles';

const mockedFiletype1: Filetype = {
  id: 'eb5d332e-61a1-422d-aeba-48186d9f79f3',
  filetype: 'JavaScript',
  handler: 'Editor',
  extensions: ['js', 'jsm']
};

const mockedFiletype2: Filetype = {
  id: '78aa4b01-ce6e-3161-4671-b0019de5c375',
  filetype: 'Directory',
  handler: 'Explorer',
  extensions: []
};

const mockedFiletype3: Filetype = {
  id: '0b743dd5-2559-4f03-8c02-0f67676e906a',
  filetype: 'Text',
  handler: 'Editor',
  extensions: ['txt']
};

const mockedRepository: Repository = {
  id: '94304818-ca39-4fb1-9499-86aa329597b9',
  name: 'foo/myRepo',
  root: 'foo/',
  corsProxy: 'http://www.oregonstate.edu',
  url: 'https://github.com/foo/myRepo',
  default: 'main',
  local: ['main', 'sample', 'test'],
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

const mockedMetafile: VersionedMetafile = {
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

describe('metafileSelectors', () => {
  it('node::fs module cannot be injected into this jest test suite, so passthrough', () => {
    expect(true).toBeTruthy();
  });

  //   const store = mockStore(emptyStore);
  //   let mockedInstance: MockInstance;

  //   beforeEach(async () => {
  //     store.dispatch(filetypeAdded(mockedFiletype1));
  //     store.dispatch(filetypeAdded(mockedFiletype2));
  //     store.dispatch(filetypeAdded(mockedFiletype3));
  //     store.dispatch(repoAdded(mockedRepository));
  //     store.dispatch(branchAdded(mockedBranch));
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

  //   it('selectByIds caches on ids and recomputes when Metafile entities change', async () => {
  //     const metafile1 = await store.dispatch(fetchMetafile({ path: 'foo/bar.js' })).unwrap();
  //     const metafile2 = await store.dispatch(fetchMetafile({ path: 'foo/zap.ts' })).unwrap();
  //     await delay(3); // prevent race condition where `modified` timestamp is updated to the same value
  //     metafileSelectors.selectByIds.clearCache();

  //     metafileSelectors.selectByIds(store.getState(), [metafile1.id, metafile2.id]);
  //     store.dispatch(metafilesUpdated([metafile1, metafile2])); // `modified` timestamp will be updated
  //     metafileSelectors.selectByIds(store.getState(), [metafile1.id, metafile2.id]);
  //     metafileSelectors.selectByIds(store.getState(), [metafile1.id]);
  //     metafileSelectors.selectByIds(store.getState(), [metafile1.id, metafile2.id]); // cached
  //     return expect(metafileSelectors.selectByIds.recomputations()).toBe(3);
  //   });

  //   it('select[subtype] selectors recompute when selectAll results change', async () => {
  //     expect.assertions(5);
  //     const metafile = await store.dispatch(fetchMetafile({ path: 'foo/bar.js' })).unwrap();
  //     await delay(3); // prevent race condition where `modified` timestamp is updated to the same value
  //     metafileSelectors.selectFilebased.resetRecomputations();
  //     metafileSelectors.selectFiles.resetRecomputations();
  //     metafileSelectors.selectDirectories.resetRecomputations();

  //     metafileSelectors.selectFilebased(store.getState());

  //     store.dispatch(metafileUpdated(metafile)); // `modified` timestamp will be updated

  //     metafileSelectors.selectFilebased(store.getState());
  //     metafileSelectors.selectFilebased(store.getState()); //cached
  //     return expect(metafileSelectors.selectFilebased.recomputations()).toBe(2);
  //   });

  //   it('selectByFilepath caches on filepath and handlers and recomputes when selectFilebased results change', async () => {
  //     metafileSelectors.selectAll.clearCache();
  //     metafileSelectors.selectByFilepath.clearCache();
  //     const metafile1 = await store.dispatch(fetchMetafile({ path: 'foo/bar.js' })).unwrap();
  //     const metafile2 = await store.dispatch(fetchMetafile({ path: 'foo/zap.ts' })).unwrap();
  //     await delay(3); // prevent race condition where `modified` timestamp is updated to the same value
  //     metafileSelectors.selectByFilepath.resetRecomputations();

  //     metafileSelectors.selectByFilepath(store.getState(), 'foo/bar.js');
  //     metafileSelectors.selectByFilepath(store.getState(), 'foo/bar.js');
  //     store.dispatch(metafileUpdated(metafile1)); // `modified` timestamp will be updated
  //     store.dispatch(metafileUpdated(metafile2));
  //     metafileSelectors.selectByFilepath(store.getState(), 'foo/bar.js');
  //     metafileSelectors.selectByFilepath(store.getState(), 'foo/zap.ts');
  //     metafileSelectors.selectByFilepath(store.getState(), 'foo/bar.js'); // cached
  //     metafileSelectors.selectByFilepath(store.getState(), 'foo/zap.ts'); // cached
  //     return expect(metafileSelectors.selectByFilepath.recomputations()).toBe(3);
  //   });

  //   it('selectByRoot caches on root and direct and recomputes when selectFilebased results change', async () => {
  //     metafileSelectors.selectByRoot.clearCache();
  //     const metafile1 = await store.dispatch(fetchMetafile({ path: 'foo/bar.js' })).unwrap();
  //     const metafile2 = await store.dispatch(fetchMetafile({ path: 'foo/example.js' })).unwrap();
  //     metafileSelectors.selectByRoot.resetRecomputations();

  //     metafileSelectors.selectByRoot(store.getState(), 'foo', true);
  //     store.dispatch(metafileUpdated(metafile1)); // `modified` timestamp will be updated
  //     store.dispatch(metafileUpdated(metafile2));
  //     metafileSelectors.selectByRoot(store.getState(), 'foo', true);
  //     metafileSelectors.selectByRoot(store.getState(), 'foo', false);
  //     metafileSelectors.selectByRoot(store.getState(), 'foo', true); // cached
  //     metafileSelectors.selectByRoot(store.getState(), 'foo', false); // cached
  //     return expect(metafileSelectors.selectByRoot.recomputations()).toBe(3);
  //   });

  //   it('selectDescendantsByRoot caches on root and direct and recomputes when selectByRoot results change', async () => {
  //     metafileSelectors.selectDescendantsByRoot.clearCache();
  //     const metafile1 = await store.dispatch(fetchMetafile({ path: 'foo/bar.js' })).unwrap();
  //     const metafile2 = await store.dispatch(fetchMetafile({ path: 'foo/example.js' })).unwrap();
  //     await delay(3); // prevent race condition where `modified` timestamp is updated to the same value
  //     metafileSelectors.selectDescendantsByRoot.resetRecomputations();

  //     metafileSelectors.selectDescendantsByRoot(store.getState(), 'foo', true);
  //     store.dispatch(metafileUpdated(metafile1)); // `modified` timestamp will be updated
  //     store.dispatch(metafileUpdated(metafile2));
  //     metafileSelectors.selectDescendantsByRoot(store.getState(), 'foo', true);
  //     metafileSelectors.selectDescendantsByRoot(store.getState(), 'bar', true);
  //     metafileSelectors.selectDescendantsByRoot(store.getState(), 'foo', true); // cached
  //     metafileSelectors.selectDescendantsByRoot(store.getState(), 'bar', false);
  //     metafileSelectors.selectDescendantsByRoot(store.getState(), 'bar', true); // cached
  //     return expect(metafileSelectors.selectDescendantsByRoot.recomputations()).toBe(4);
  //   });

  //   it('selectByRepo caches on repo.id and recomputes when selectVersioned results change', async () => {
  //     expect.assertions(2);
  //     const metafile1 = await store.dispatch(fetchMetafile({ path: 'foo/bar.js' })).unwrap();
  //     await delay(3); // prevent race condition where `modified` timestamp is updated to the same value
  //     store.dispatch(metafileAdded(mockedMetafile));
  //     metafileSelectors.selectByRepo.resetRecomputations();

  //     metafileSelectors.selectByRepo(store.getState(), mockedRepository.id);
  //     store.dispatch(metafileUpdated(metafile1)); // `modified` timestamp will be updated
  //     store.dispatch(metafileUpdated(mockedMetafile));
  //     metafileSelectors.selectByRepo(store.getState(), mockedRepository.id);
  //     metafileSelectors.selectByRepo(store.getState(), '13');
  //     const metafiles = metafileSelectors.selectByRepo(store.getState(), mockedRepository.id); // cached
  //     expect(metafiles).toStrictEqual(
  //       expect.arrayContaining([
  //         expect.objectContaining({
  //           id: mockedMetafile.id,
  //           repo: mockedRepository.id
  //         })
  //       ])
  //     );
  //     return expect(metafileSelectors.selectByRepo.recomputations()).toBe(3);
  //   });

  //   it('selectByBranch caches on branch.id and filepath and recomputes when selectVersioned results change', async () => {
  //     expect.assertions(2);
  //     const metafile1 = await store.dispatch(fetchMetafile({ path: 'foo/bar.js' })).unwrap();
  //     store.dispatch(metafileAdded(mockedMetafile));
  //     metafileSelectors.selectByBranch.resetRecomputations();

  //     metafileSelectors.selectByBranch(store.getState(), mockedBranch.id);
  //     store.dispatch(metafileUpdated(metafile1)); // `modified` timestamp will be updated
  //     metafileSelectors.selectByBranch(store.getState(), mockedBranch.id);
  //     store.dispatch(metafileUpdated(mockedMetafile));
  //     metafileSelectors.selectByBranch(store.getState(), mockedBranch.id); // cached
  //     metafileSelectors.selectByBranch(store.getState(), '3');
  //     metafileSelectors.selectByBranch(store.getState(), mockedBranch.id); // cached
  //     const metafiles = metafileSelectors.selectByBranch(store.getState(), mockedBranch.id); // cached
  //     expect(metafiles).toStrictEqual(
  //       expect.arrayContaining([
  //         expect.objectContaining({
  //           id: mockedMetafile.id,
  //           branch: mockedBranch.id
  //         })
  //       ])
  //     );
  //     return expect(metafileSelectors.selectByBranch.recomputations()).toBe(3);
  //   });

  //   it('selectStagedByRepo caches on repo and branch and recomputes when selectVersioned results change', async () => {
  //     expect.assertions(3);
  //     store.dispatch(metafileAdded(mockedMetafile));
  //     metafileSelectors.selectStagedByRepo.resetRecomputations();

  //     expect(
  //       metafileSelectors.selectStagedByRepo(store.getState(), mockedRepository.id, mockedBranch.id)
  //     ).toHaveLength(0);
  //     store.dispatch(metafileUpdated({ ...mockedMetafile, status: 'modified' }));
  //     metafileSelectors.selectStagedByRepo(store.getState(), mockedRepository.id, mockedBranch.id);
  //     metafileSelectors.selectStagedByRepo(store.getState(), mockedRepository.id, mockedBranch.id); // cached
  //     expect(
  //       metafileSelectors.selectStagedByRepo(store.getState(), mockedRepository.id, mockedBranch.id)
  //     ).toStrictEqual(expect.arrayContaining([expect.objectContaining({ id: mockedMetafile.id })]));
  //     return expect(metafileSelectors.selectStagedByRepo.recomputations()).toBe(2);
  //   });
});
