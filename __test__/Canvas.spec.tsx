import React from 'react';
import { mount } from 'enzyme';
import { wrapInTestContext } from './__mocks__/dndMock';
import Canvas, { CanvasState } from '../src/components/Canvas';

describe('Canvas', () => {
  it('Canvas has an empty card state when initialized', () => {
    const CanvasContext = wrapInTestContext(Canvas);
    const ref = React.createRef();
    const enzymeWrapper = mount(<><CanvasContext ref={ref} /></>);

    const cards: CanvasState = enzymeWrapper.find('Canvas').state<CanvasState>('cards');
    expect(Object.keys(cards)).toHaveLength(2);
  });
});