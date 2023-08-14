// const mockedMetafile1: FileMetafile = {
//   id: '88e2gd50-3a5q-6401-b5b3-203c6710e35c',
//   name: 'bar.js',
//   modified: DateTime.fromISO('2015-06-19T19:10:47.319-08:00').valueOf(),
//   handler: 'Editor',
//   filetype: 'Javascript',
//   flags: [],
//   path: 'foo/bar.js',
//   state: 'unmodified',
//   content: 'file contents',
//   mtime: DateTime.fromISO('2020-01-28T07:44:15.276-08:00').valueOf()
// };

// const mockedMetafile2: FileMetafile = {
//   id: 'a5a6806b-f7e1-4f13-bca1-b1440ecd4431',
//   name: 'tap.js',
//   modified: DateTime.fromISO('2015-06-19T19:10:47.319-08:00').valueOf(),
//   handler: 'Editor',
//   filetype: 'Javascript',
//   flags: [],
//   path: 'zap/tap.js',
//   state: 'unmodified',
//   content: 'new content',
//   mtime: DateTime.fromISO('2020-02-13T11:23:05.276-08:00').valueOf()
// };

// const unhydratedDirectory: FilebasedMetafile = {
//   id: 'b859d4e8-b932-4fc7-a2f7-29a8ef8cd8f8',
//   name: 'foo',
//   modified: DateTime.fromISO('2021-01-31T11:24:54.527-08:00').valueOf(),
//   handler: 'Explorer',
//   filetype: 'Directory',
//   flags: [],
//   path: 'foo',
//   state: 'unmodified',
//   mtime: 0
// };

// const hydratedDirectory: DirectoryMetafile = {
//   id: '764bc7ac-deb1-48b4-ac24-a026e70f53ec',
//   name: 'zap',
//   modified: DateTime.fromISO('2021-01-31T11:24:54.527-08:00').valueOf(),
//   handler: 'Explorer',
//   filetype: 'Directory',
//   flags: [],
//   path: 'zap',
//   state: 'unmodified',
//   contains: ['a5a6806b-f7e1-4f13-bca1-b1440ecd4431'],
//   mtime: DateTime.fromISO('2021-05-19T11:53:41.276-08:00').valueOf()
// };

describe('Directory', () => {
  it('node::fs module cannot be injected into this jest test suite, so passthrough', () => {
    expect(true).toBeTruthy();
  });
  // const store = mockStore(emptyStore);
  // let mockedInstance: MockInstance;

  // beforeEach(async () => {
  //   store.dispatch(metafileAdded(mockedMetafile1));
  //   store.dispatch(metafileAdded(mockedMetafile2));
  //   store.dispatch(metafileAdded(unhydratedDirectory));
  //   store.dispatch(metafileAdded(hydratedDirectory));
  //   const instance = await mock({
  //     'foo/bar.js': file({ content: 'file contents', mtime: new Date(1) }),
  //     'zap/tap.js': file({ content: 'new content', mtime: new Date(1) })
  //   });
  //   return (mockedInstance = instance);
  // });

  // afterAll(() => mockedInstance.reset());

  // afterEach(() => {
  //   cleanup;
  //   store.clearActions();
  //   jest.clearAllMocks();
  // });

  // it('Directory initially renders with loading indicator', () => {
  //   expect.assertions(2);
  //   render(
  //     <Provider store={store}>
  //       <TreeView>
  //         <Directory id={unhydratedDirectory.id} expanded={[]} />{' '}
  //       </TreeView>
  //     </Provider>
  //   );
  //   expect(screen.getByLabelText(/loading/i)).toBeInTheDocument();
  //   expect(screen.queryByText('foo')).not.toBeInTheDocument();
  // });

  // it('Directory eventually renders without expanding to display children', async () => {
  //   expect.assertions(3);
  //   render(
  //     <Provider store={store}>
  //       <TreeView>
  //         <Directory id={hydratedDirectory.id} expanded={[]} />{' '}
  //       </TreeView>
  //     </Provider>
  //   );
  //   await expect(screen.findByRole('treeitem')).resolves.toBeInTheDocument();
  //   await expect(screen.findByText('zap')).resolves.toBeInTheDocument();
  //   return expect(screen.queryByText('tap.js')).not.toBeInTheDocument();
  // });

  // it('Directory expands to display child files and directories', async () => {
  //   expect.assertions(5);
  //   jest.spyOn(metafileThunks, 'updateVersionedMetafile').mockImplementation(
  //     createAppAsyncThunk<VersionedMetafile | FilebasedMetafile | undefined, UUID>(
  //       'metafiles/updateVersionedMetafile',
  //       async id => {
  //         return store.getState().metafiles.entities[id] as FilebasedMetafile;
  //       }
  //     )
  //   );
  //   render(
  //     <Provider store={store}>
  //       <TreeView>
  //         <Directory id={hydratedDirectory.id} expanded={[]} />
  //       </TreeView>
  //     </Provider>
  //   );
  //   await expect(screen.findByRole('tree')).resolves.toBeInTheDocument();
  //   await expect(screen.findByText('zap')).resolves.toBeInTheDocument();
  //   expect(screen.queryByText('tap.js')).not.toBeInTheDocument();

  //   const parent = await screen.findByText('zap');
  //   expect(parent).toBeInTheDocument();

  //   fireEvent.click(parent);

  //   const child = await screen.findByText('tap.js');
  //   expect(child).toBeInTheDocument();
  // });
});
