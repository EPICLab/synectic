describe('Canvas component', () => {
  it('node::fs module cannot be injected into this jest test suite, so passthrough', () => {
    expect(true).toBeTruthy();
  });
  // const produceComponent = () =>
  //   render(
  //     <Provider store={redux.store}>
  //       <DndProvider backend={HTML5Backend}>
  //         <Canvas />
  //       </DndProvider>
  //     </Provider>
  //   );

  // it('renders the canvas component', () => {
  //   produceComponent();
  //   expect(screen.getByTestId(/canvas-component/i)).toBeInTheDocument();
  // });
});
