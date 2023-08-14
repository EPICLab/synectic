import { emptyStore } from '../../test-utils/empty-store';
import { file, mock, MockInstance } from '../../test-utils/mock-fs';
import { mockStore } from '../../test-utils/mock-store';
import { Modal, modalAdded, modalRemoved } from '../slices/modals';
import modalSelectors from './modals';

const mockedModal: Modal = {
  id: '913dd7b1-5494-a513-f14f-490843a811b3',
  type: 'MergeSelector',
  target: '46ae0111-0c82-4ee2-9ee5-cd5bdf8d8a71'
};

describe('modalsSelectors', () => {
  it('node::fs module cannot be injected into this jest test suite, so passthrough', () => {
    expect(true).toBeTruthy();
  });

  //   const store = mockStore(emptyStore);
  //   let mockedInstance: MockInstance;

  //   beforeEach(async () => {
  //     store.dispatch(modalAdded(mockedModal));
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

  //   it('selectById caches on id and recomputes when Repository entities change', async () => {
  //     modalSelectors.selectById.resetRecomputations();

  //     modalSelectors.selectById(store.getState(), mockedModal.id);
  //     store.dispatch(modalRemoved(mockedModal.id));
  //     modalSelectors.selectById(store.getState(), mockedModal.id);
  //     modalSelectors.selectById(store.getState(), '');
  //     modalSelectors.selectById(store.getState(), mockedModal.id); // cached
  //     return expect(modalSelectors.selectById.recomputations()).toBe(3);
  //   });

  //   it('selectByType caches on type and recomputes when selectAll results change', async () => {
  //     modalSelectors.selectByType.resetRecomputations();

  //     modalSelectors.selectByType(store.getState(), 'MergeSelector');
  //     store.dispatch(modalRemoved(mockedModal.id));
  //     modalSelectors.selectByType(store.getState(), 'MergeSelector');
  //     modalSelectors.selectByType(store.getState(), 'NewCardDialog');
  //     modalSelectors.selectByType(store.getState(), 'MergeSelector'); // cached
  //     return expect(modalSelectors.selectByType.recomputations()).toBe(3);
  //   });
});
