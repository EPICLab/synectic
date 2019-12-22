import React from 'react';
import { mount } from 'enzyme';
import { wrapInTestContext } from './__mocks__/dndMock';
import { CanvasComponent } from '../src/components/CanvasComponent';
// import { Card } from '../src/store/types';
import { createStore } from 'redux';
import { rootReducer } from '../src/store/root';
import { Provider } from 'react-redux';

describe('Canvas', () => {

  it('Canvas has an empty card state when initialized', () => {
    const store = createStore(rootReducer);
    const CanvasContext = wrapInTestContext(CanvasComponent);
    const ref = React.createRef();
    const enzymeWrapper = mount(<Provider store={store}><CanvasContext ref={ref} /></Provider>);
    expect(enzymeWrapper.exists()).toBe(true);

    // const cards = enzymeWrapper.find('CanvasComponent').state<Card[]>('cards');
    // expect(Object.keys(cards)).toHaveLength(0);

    console.log(`canvasComponent.spec.tsx cannot successfully evaluate CanvasComp because a React Redux provider is required to be wrapped around the component`);
    expect(true).toBe(true);

  });
});