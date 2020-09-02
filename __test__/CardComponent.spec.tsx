import React from 'react';
import isUUID from 'validator/lib/isUUID';
import { mount } from 'enzyme';
import { v4 } from 'uuid';
import { DateTime } from 'luxon';

import { wrapInReduxContext } from './__mocks__/dndReduxMock';
import { mockStore } from './__mocks__/reduxStoreMock';
import { Card } from '../src/types';
import CardComponent from '../src/components/CardComponent';
import Editor from '../src/components/Editor';

describe('CardComponent', () => {

  const domElement = document.getElementById('app');
  const mountOptions = { attachTo: domElement, };

  const store = mockStore({
    canvas: {
      id: v4(),
      created: DateTime.fromISO('1991-12-26T08:00:00.000-08:00'),
      repos: [],
      cards: ['14', '17734ae2-f8da-40cf-be86-993dc21b4079'],
      stacks: []
    },
    stacks: {},
    cards: {
      14: {
        id: '14',
        name: 'test.js',
        type: 'Editor',
        related: ['243'],
        created: DateTime.fromISO('2019-01-21T08:14:52.181-08:00'),
        modified: DateTime.fromISO('2019-11-19T19:22:47.572-08:00'),
        captured: false,
        left: 10,
        top: 10
      },
      '17734ae2-f8da-40cf-be86-993dc21b4079': {
        id: '17734ae2-f8da-40cf-be86-993dc21b4079',
        name: 'example.ts',
        type: 'Editor',
        related: ['199'],
        created: DateTime.fromISO('2019-01-21T08:14:52.181-08:00'),
        modified: DateTime.fromISO('2019-11-19T19:22:47.572-08:00'),
        captured: false,
        left: 20,
        top: 40
      }
    },
    filetypes: {},
    metafiles: {
      199: {
        id: '199',
        name: 'test.js',
        modified: DateTime.fromISO('2019-11-19T19:19:47.572-08:00'),
        content: 'const rand: number = Math.floor(Math.random() * 6) + 1;'
      },
      243: {
        id: '243',
        name: 'example.ts',
        modified: DateTime.fromISO('2015-06-19T19:10:47.572-08:00'),
        content: 'var rand = Math.floor(Math.random() * 6) + 1;'
      }
    },
    repos: {},
    errors: {}
  });

  afterEach(store.clearActions);

  const cards = store.getState().cards as { [id: string]: Card };

  it('Card resolves props into React Component for Editor handler', () => {
    const CardContext = wrapInReduxContext(CardComponent, store);
    const wrapper = mount(<CardContext {...cards['14']} />, mountOptions);
    expect(wrapper.find(Editor)).toHaveLength(1);
  });

  it('Card has a valid UUID when props contain a valid UUID', () => {
    const CardContext = wrapInReduxContext(CardComponent, store);
    const wrapper = mount(<CardContext {...cards['17734ae2-f8da-40cf-be86-993dc21b4079']} />, mountOptions);
    const component = wrapper.find(CardComponent).first();
    expect(isUUID(component.props().id, 4)).toBe(true);
  });

});