import React from 'react';
import isUUID from 'validator/lib/isUUID';
import { mount } from 'enzyme';
import { v4 } from 'uuid';
import { DateTime } from 'luxon';
import { render, screen, fireEvent, act } from '@testing-library/react';

import { wrapInReduxContext } from './__mocks__/dndReduxMock';
import { mockStore, extractFieldMap } from './__mocks__/reduxStoreMock';
import CardComponent from '../src/components/CardComponent';
import Editor from '../src/components/Editor';
import Diff from '../src/components/Diff';
import Explorer from '../src/components/Explorer';
import { BrowserComponent } from '../src/components/Browser';
import { VersionStatusComponent } from '../src/components/RepoBranchList';

describe('CardComponent', () => {

  const domElement = document.getElementById('app');
  const mountOptions = { attachTo: domElement, };

  const store = mockStore({
    canvas: {
      id: v4(),
      created: DateTime.fromISO('1991-12-26T08:00:00.000-08:00'),
      repos: [],
      cards: ['14', '17734ae2-f8da-40cf-be86-993dc21b4079', '22', '573', '46'],
      stacks: []
    },
    stacks: {},
    cards: {
      14: {
        id: '14',
        name: 'test.js',
        type: 'Editor',
        metafile: '243',
        created: DateTime.fromISO('2019-01-21T08:14:52.181-08:00'),
        modified: DateTime.fromISO('2019-11-19T19:22:47.572-08:00'),
        left: 10,
        top: 10
      },
      '17734ae2-f8da-40cf-be86-993dc21b4079': {
        id: '17734ae2-f8da-40cf-be86-993dc21b4079',
        name: 'example.ts',
        type: 'Editor',
        metafile: '199',
        created: DateTime.fromISO('2019-01-21T08:14:52.181-08:00'),
        modified: DateTime.fromISO('2019-11-19T19:22:47.572-08:00'),
        left: 20,
        top: 40
      },
      22: {
        id: '22',
        name: 'foo',
        type: 'Diff',
        metafile: '243',
        created: DateTime.fromISO('2019-01-21T08:14:52.181-08:00'),
        modified: DateTime.fromISO('2019-11-19T19:22:47.572-08:00'),
        left: 10,
        top: 10
      },
      573: {
        id: '573',
        name: 'bar',
        type: 'Explorer',
        metafile: '243',
        created: DateTime.fromISO('2019-01-21T08:14:52.181-08:00'),
        modified: DateTime.fromISO('2019-11-19T19:22:47.572-08:00'),
        left: 10,
        top: 10
      },
      6: {
        id: '6',
        name: 'zap',
        type: 'Browser',
        metafile: '243',
        created: DateTime.fromISO('2019-01-21T08:14:52.181-08:00'),
        modified: DateTime.fromISO('2019-11-19T19:22:47.572-08:00'),
        left: 10,
        top: 10
      },
      46: {
        id: '46',
        name: 'baz',
        type: 'Tracker',
        metafile: '243',
        created: DateTime.fromISO('2019-01-21T08:14:52.181-08:00'),
        modified: DateTime.fromISO('2019-11-19T19:22:47.572-08:00'),
        left: 10,
        top: 10
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

  const cards = extractFieldMap(store.getState().cards);

  it('Card resolves props into React Component for Editor handler', () => {
    const CardContext = wrapInReduxContext(CardComponent, store);
    const wrapper = mount(<CardContext {...cards['14']} />, mountOptions);
    expect(wrapper.find(Editor)).toHaveLength(1);
  });

  it('Card resolves props into React Component for Diff handler', () => {
    const CardContext = wrapInReduxContext(CardComponent, store);
    const wrapper = mount(<CardContext {...cards['22']} />, mountOptions);
    expect(wrapper.find(Diff)).toHaveLength(1);
  });

  it('Card resolves props into React Component for Explorer handler', () => {
    const CardContext = wrapInReduxContext(CardComponent, store);
    const wrapper = mount(<CardContext {...cards['573']} />, mountOptions);
    expect(wrapper.find(Explorer)).toHaveLength(1);
  });

  it('Card resolves props into React Component for Browser handler', () => {
    const CardContext = wrapInReduxContext(CardComponent, store);
    const wrapper = mount(<CardContext {...cards['6']} />, mountOptions);
    expect(wrapper.find(BrowserComponent)).toHaveLength(1);
  });

  it('Card resolves props into React Component for Tracker handler', () => {
    const CardContext = wrapInReduxContext(CardComponent, store);
    const wrapper = mount(<CardContext {...cards['46']} />, mountOptions);
    expect(wrapper.find(VersionStatusComponent)).toHaveLength(1);
  });

  it('Card has a valid UUID when props contain a valid UUID', () => {
    const CardContext = wrapInReduxContext(CardComponent, store);
    const wrapper = mount(<CardContext {...cards['17734ae2-f8da-40cf-be86-993dc21b4079']} />, mountOptions);
    const component = wrapper.find(CardComponent).first();
    expect(isUUID(component.props().id, 4)).toBe(true);
  });

  it('Editor Card renders a reverse side when the flip button is clicked', () => {
    const CardContext = wrapInReduxContext(CardComponent, store);
    render(<CardContext {...cards['14']} />);

    let backsideID = screen.queryByText(/ID:/i);
    expect(backsideID).not.toBeInTheDocument();

    const flipButton = screen.getByRole('button', { name: /button-flip/i });
    act(() => {
      fireEvent.click(flipButton);
    });

    backsideID = screen.queryByText(/ID:/i);
    expect(backsideID).toBeInTheDocument();
  });

  it('Explorer Card renders a reverse side when the flip button is clicked', () => {
    const CardContext = wrapInReduxContext(CardComponent, store);
    render(<CardContext {...cards['573']} />);

    let backsideName = screen.queryByText(/Name:/i);
    expect(backsideName).not.toBeInTheDocument();

    const flipButton = screen.getAllByRole('button')[0];
    act(() => {
      fireEvent.click(flipButton);
    });

    backsideName = screen.queryByText(/Name:/i);
    expect(backsideName).toBeInTheDocument();
  });

  it('Diff Card renders a reverse side when the flip button is clicked', () => {
    const CardContext = wrapInReduxContext(CardComponent, store);
    render(<CardContext {...cards['22']} />);

    let backsideName = screen.queryByText(/Name:/i);
    expect(backsideName).not.toBeInTheDocument();

    const flipButton = screen.getAllByRole('button')[0];
    act(() => {
      fireEvent.click(flipButton);
    });

    backsideName = screen.queryByText(/Name:/i);
    expect(backsideName).toBeInTheDocument();
  });

  it('Browser Card renders a reverse side when the flip button is clicked', () => {
    const CardContext = wrapInReduxContext(CardComponent, store);
    render(<CardContext {...cards['6']} />);

    const buttons = screen.getAllByRole('button');

    let numButtons = buttons.length;
    expect(numButtons).toBe(5);

    const flipButton = buttons[0];
    act(() => {
      fireEvent.click(flipButton);
    });

    numButtons = screen.getAllByRole('button').length;
    expect(numButtons).toBe(2);
  });

  it('Tracker Card renders a reverse side when the flip button is clicked', () => {
    const CardContext = wrapInReduxContext(CardComponent, store);
    render(<CardContext {...cards['46']} />);

    let icon = screen.queryByRole('img');
    expect(icon).toBeInTheDocument();

    const flipButton = screen.getAllByRole('button')[0];
    act(() => {
      fireEvent.click(flipButton);
    });

    icon = screen.queryByRole('img');
    expect(icon).not.toBeInTheDocument();
  });
});