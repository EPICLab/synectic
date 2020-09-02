import React from 'react';
import isUUID from 'validator/lib/isUUID';
import { mount } from 'enzyme';
import { v4 } from 'uuid';
import { DateTime } from 'luxon';

import { wrapInReduxContext } from './__mocks__/dndReduxMock';
import { mockStore } from './__mocks__/reduxStoreMock';
import CanvasComponent from '../src/components/CanvasComponent';
import CardComponent from '../src/components/CardComponent';
import StackComponent from '../src/components/StackComponent';

describe('CanvasComponent', () => {

  const domElement = document.getElementById('app');
  const mountOptions = { attachTo: domElement, };
  const store = mockStore({
    canvas: {
      id: v4(),
      created: DateTime.fromISO('1991-12-26T08:00:00.000-08:00'),
      repos: [],
      cards: [],
      stacks: []
    },
    stacks: {},
    cards: {},
    filetypes: {},
    metafiles: {},
    repos: {},
    errors: {}
  });

  afterEach(store.clearActions);

  it('Canvas has a valid UUID when props contain valid UUID', () => {
    const CanvasContext = wrapInReduxContext(CanvasComponent, store);
    const canvasProps = store.getState().canvas;
    const wrapper = mount(<CanvasContext {...canvasProps} />, mountOptions);
    const component = wrapper.find(CanvasComponent).first();
    expect(isUUID(component.props().id, 4)).toBe(true);
  });

  it('Canvas resolves props into React Components for cards', () => {
    const CanvasContext = wrapInReduxContext(CanvasComponent, store);
    const canvasProps = store.getState().canvas;
    const wrapper = mount(<CanvasContext {...canvasProps} />, mountOptions);
    const component = wrapper.find(CanvasComponent).first();
    expect(wrapper.find(CardComponent)).toHaveLength(component.props().cards.length);
  });

  it('Canvas resolves props into React Components for stacks', () => {
    const CanvasContext = wrapInReduxContext(CanvasComponent, store);
    const canvasProps = store.getState().canvas;
    const wrapper = mount(<CanvasContext {...canvasProps} />, mountOptions);
    const component = wrapper.find(CanvasComponent).first();
    expect(wrapper.find(StackComponent)).toHaveLength(component.props().stacks.length);
  });

});