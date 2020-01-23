import React from 'react';
import isUUID from 'validator/lib/isUUID';
import { mount } from 'enzyme';
import { wrapInTestContext } from './__mocks__/dndMock';
import { createStore } from 'redux';
import { rootReducer } from '../src/store/root';
import { Provider } from 'react-redux';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

import CanvasComponent from '../src/components/CanvasComponent';
import { Canvas } from '../src/types';

describe('CanvasComponent', () => {

  const canvasProp: Canvas = {
    id: v4(),
    created: DateTime.fromISO('2019-11-19T19:22:47.572-08:00'),
    repos: ['13'],
    cards: ['29'],
    stacks: ['33']
  };

  const store = createStore(rootReducer);
  const CanvasContext = wrapInTestContext(CanvasComponent);
  const ref = React.createRef();
  const enzymeWrapper = mount(<Provider store={store}><CanvasContext ref={ref} {...canvasProp} ></CanvasContext></Provider>);

  it('Canvas has an empty card state when initialized', () => {
    const canvas = enzymeWrapper.find(CanvasComponent).first();
    const cards = canvas.props().cards ? canvas.props().cards : [];
    expect(cards).toHaveLength(1);
  });

  it('CanvasComponent has a valid UUID when props contain valid UUID', () => {
    const canvas = enzymeWrapper.find(CanvasComponent).first();
    const uuid = canvas.props().id ? canvas.props().id : '';
    expect(isUUID((uuid ? uuid : ''), 4)).toBe(true);
  });
}); 