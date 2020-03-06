import React from 'react';
import isUUID from 'validator/lib/isUUID';
import { mount } from 'enzyme';

import { wrapInTestContext } from './__mocks__/dndReduxMock';
import { getMockStore, getCardProps } from './__mocks__/reduxStoreMock';
// eslint-disable-next-line import/no-named-as-default
import CardComponent from '../src/components/CardComponent';
import Editor from '../src/components/Editor';

describe('CardComponent', () => {

  const domElement = document.getElementById('app');
  const mountOptions = {
    attachTo: domElement,
  };
  const store = getMockStore();
  const cardProps = getCardProps(0);

  it('Card resolves props into React Component for Editor handler', () => {
    const CardContext = wrapInTestContext(CardComponent, store);
    const wrapper = mount(<CardContext {...cardProps} />, mountOptions);
    expect(wrapper.find(Editor)).toHaveLength(1);
  });

  it('Card has a valid UUID when props contain a valid UUID', () => {
    const CardContext = wrapInTestContext(CardComponent, store);
    const wrapper = mount(<CardContext {...getCardProps(1)} />, mountOptions);
    const component = wrapper.find(CardComponent).first();
    expect(isUUID(component.props().id, 4)).toBe(true);
  });

});