import React from 'react';
// import isUUID from 'validator/lib/isUUID';
import { mount } from 'enzyme';
import { wrapInTestContext } from './__mocks__/dndReduxMock';
import { createStore } from 'redux';
import { rootReducer } from '../src/store/root';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

// eslint-disable-next-line import/no-named-as-default
import CardComponent from '../src/components/CardComponent';
import { Card } from '../src/types';

describe('CardComponent', () => {

  const domElement = document.getElementById('app');
  const mountOptions = {
    attachTo: domElement,
  };
  const store = createStore(rootReducer);

  const cardProp: Card = {
    id: v4(),
    name: 'test.js',
    type: 'Editor',
    related: ['324e359f324hf523'],
    created: DateTime.fromISO('2019-11-19T19:22:47.572-08:00'),
    modified: DateTime.fromISO('2019-11-19T19:22:47.572-08:00'),
    captured: false,
    left: 0,
    top: 0
  };

  it('CardComponent should work', () => {
    const CardContext = wrapInTestContext(CardComponent, store);
    const wrapper = mount(<CardContext {...cardProp} />, mountOptions);
    const component = wrapper.find(CardComponent).first();
    expect(component).toBeDefined();
  });

  // it('CardComponent has a valid UUID when props contain valid UUID', () => {
  //   const store = createStore(rootReducer);
  //   const CardContext = wrapInTestContext(CardComponent, store);
  //   const ref = React.createRef();
  //   const enzymeWrapper = mount(<CardContext ref={ref} {...cardProp} />);
  //   expect(enzymeWrapper.find(CardComponent)).toHaveLength(1);

  //   const card = enzymeWrapper.find(CardComponent).first();
  //   const uuid = card.props().id ? card.props().id : '';
  //   expect(isUUID((uuid ? uuid : ''), 4)).toBe(true);
  // });

});