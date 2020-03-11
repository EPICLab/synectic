import React from 'react';
// import isUUID from 'validator/lib/isUUID';
import { mount } from 'enzyme';
import { wrapInTestContext } from './__mocks__/dndReduxMock';
import CanvasComponent from '../src/components/CanvasComponent';
import { getMockStore, getCanvasProps } from './__mocks__/baseReduxMock';
import CardComponent from '../src/components/CardComponent';

describe('CanvasComponent', () => {

  const domElement = document.getElementById('app');
  const mountOptions = {
    attachTo: domElement,
  };
  const store = getMockStore();
  const canvasProps = getCanvasProps();

  it('Canvas accepts initial state of cards via props', () => {
    const CanvasContext = wrapInTestContext(CanvasComponent, store);
    const wrapper = mount(<CanvasContext {...canvasProps} />, mountOptions);
    const component = wrapper.find(CanvasComponent).first();
    expect(component.props().cards).toHaveLength(2);
  });

  it('Canvas accepts initial state of stacks via props', () => {
    const CanvasContext = wrapInTestContext(CanvasComponent, store);
    const wrapper = mount(<CanvasContext {...canvasProps} />, mountOptions);
    const component = wrapper.find(CanvasComponent).first();
    expect(component.props().stacks).toHaveLength(1);
  });

  it('Canvas accepts initial state of repos via props', () => {
    const CanvasContext = wrapInTestContext(CanvasComponent, store);
    const wrapper = mount(<CanvasContext {...canvasProps} />, mountOptions);
    const component = wrapper.find(CanvasComponent).first();
    expect(component.props().repos).toHaveLength(1);
  });

  it('Canvas contains dependent React Components for cards', () => {
    const CanvasContext = wrapInTestContext(CanvasComponent, store);
    const wrapper = mount(<CanvasContext {...canvasProps} />, mountOptions);
    expect(wrapper.find(CardComponent)).toHaveLength(2);
  });

  // it('CanvasComponent has a valid UUID when props contain valid UUID', () => {
  //   expect(enzymeWrapper).toBeDefined();
  //   // const canvas = enzymeWrapper.find(CanvasComponent).first();
  //   // const uuid = canvas.props().id ? canvas.props().id : '';
  //   // expect(isUUID((uuid ? uuid : ''), 4)).toBe(true);
  // });
});