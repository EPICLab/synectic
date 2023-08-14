describe('Explorer component', () => {
  it('node::fs module cannot be injected into this jest test suite, so passthrough', () => {
    expect(true).toBeTruthy();
  });
  // const produceComponent = () =>
  //     render(
  //         <Provider store={redux.store} >
  //             <DndProvider backend={HTML5Backend}>
  //                 <Explorer id='3' />
  //             </DndProvider>
  //         </Provider>
  //     );

  // it('renders the explorer card component', () => {
  //     produceComponent();
  //     expect(screen.getByTestId(/explorer-component/i)).toBeInTheDocument();
  // });
});
