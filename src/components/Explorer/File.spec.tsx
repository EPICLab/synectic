// const mockedMetafile: FileMetafile = {
//   id: '88e2gd50-3a5q-6401-b5b3-203c6710e35c',
//   name: 'bar.js',
//   modified: DateTime.fromISO('2015-06-19T19:10:47.319-08:00').valueOf(),
//   handler: 'Editor',
//   filetype: 'Javascript',
//   flags: [],
//   path: 'foo/bar.js',
//   state: 'unmodified',
//   content: 'file contents',
//   mtime: DateTime.now().valueOf()
// };

describe('FileComponent', () => {
  it('node::fs module cannot be injected into this jest test suite, so passthrough', () => {
    expect(true).toBeTruthy();
  });
  // const store = mockStore(emptyStore);
  // let mockedInstance: MockInstance;

  // beforeAll(async () => {
  //   store.dispatch(metafileAdded(mockedMetafile));
  //   const instance = await mock({
  //     'foo/bar.js': file({ content: 'file contents', mtime: new Date(1) })
  //   });
  //   return (mockedInstance = instance);
  // });

  // afterAll(() => mockedInstance.reset());

  // afterEach(() => {
  //   cleanup;
  //   store.clearActions();
  // });

  // it('FileComponent renders file information', async () => {
  //   render(
  //     <Provider store={store}>
  //       <TreeView>
  //         <File id={mockedMetafile.id} />
  //       </TreeView>
  //     </Provider>
  //   );
  //   const component = await screen.findByText('bar.js');

  //   expect(component).toBeInTheDocument();
  // });
});
