import React from 'react';
import { mount } from 'enzyme';
import { wrapInTestContext } from './__mocks__/dndMock';
import Card from '../src/components/Card';

describe('Card', () => {
  const CardContext = wrapInTestContext(Card);
  const ref = React.createRef();
  const enzymeWrapper = mount(<><CardContext ref={ref} id='test' left={5} top={10} /></>);

  it('Card reflects props id (BAD TEST: Idiomatic unit tests focus on functionality, not implementation)', () => {
    expect(enzymeWrapper.find('Card').prop('id')).toBe('test');
  });
});
