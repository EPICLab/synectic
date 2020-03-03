import React from 'react';
// import isUUID from 'validator/lib/isUUID';
import { mount } from 'enzyme';
import { createStore } from 'redux';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

import { wrapInTestContext } from './__mocks__/dndReduxMock';
import { rootReducer } from '../src/store/root';
import { Canvas } from '../src/types';
import CanvasComponent from '../src/components/CanvasComponent';

describe('CanvasComponent', () => {

  const domElement = document.getElementById('app');
  const mountOptions = {
    attachTo: domElement,
  };
  const store = createStore(rootReducer);

  const canvasProp: Canvas = {
    id: v4(),
    created: DateTime.fromISO('2019-11-19T19:22:47.572-08:00'),
    repos: ['13'],
    cards: ['29'],
    stacks: ['33']
  };

  it('Canvas accepts initial state of cards via props', () => {
    const CanvasContext = wrapInTestContext(CanvasComponent, store);
    const wrapper = mount(<CanvasContext {...canvasProp} />, mountOptions);
    const component = wrapper.find(CanvasComponent).first();
    expect(component.props().cards).toHaveLength(1);
  });

  it('Canvas accepts initial state of stacks via props', () => {
    const CanvasContext = wrapInTestContext(CanvasComponent, store);
    const wrapper = mount(<CanvasContext {...canvasProp} />, mountOptions);
    const component = wrapper.find(CanvasComponent).first();
    expect(component.props().stacks).toHaveLength(1);
  });

  it('Canvas accepts initial state of repos via props', () => {
    const CanvasContext = wrapInTestContext(CanvasComponent, store);
    const wrapper = mount(<CanvasContext {...canvasProp} />, mountOptions);
    const component = wrapper.find(CanvasComponent).first();
    expect(component.props().repos).toHaveLength(1);
  });

  // it('CanvasComponent has a valid UUID when props contain valid UUID', () => {
  //   expect(enzymeWrapper).toBeDefined();
  //   // const canvas = enzymeWrapper.find(CanvasComponent).first();
  //   // const uuid = canvas.props().id ? canvas.props().id : '';
  //   // expect(isUUID((uuid ? uuid : ''), 4)).toBe(true);
  // });
});