import * as utils from '../src/store/immutables';

type State = {
  config: { id: string; display: boolean; enabled: boolean };
  colors: string[];
  cats: { [id: string]: { id: string; age: number; color: string } };
}

const state: State = {
  config: {
    id: 'test_config',
    display: false,
    enabled: false
  },
  colors: ['red', 'green', 'blue'],
  cats: {
    'pearl': { id: 'pearl', age: 3, color: 'brown' },
    'mittens': { id: 'mittens', age: 11, color: 'white' },
    'scruffy': { id: 'scruffy', age: 6, color: 'yellow' }
  }
}

describe('immutables.updateObject', () => {
  it('updateObject immutably replaces target object', () => {
    const newConfig = { id: 'updated_config', display: true, enabled: true };
    const newState = utils.updateObject(state, { config: newConfig });
    expect(state.config).not.toMatchObject(newConfig);
    expect(newState.config).toMatchObject(newConfig);
  });

  it('updateObject immutably updates only specified properties', () => {
    const newState = utils.updateObject(state, { config: { ...state.config, enabled: true } });
    expect(newState.config.id).toMatch(state.config.id);
    expect(newState.config.enabled).toBe(true);
  });
});

describe('immutables.addItemInArray', () => {
  it('addItemInArray immutably adds object to array', () => {
    const newColors = utils.addItemInArray(state.colors, 'yellow');
    expect(newColors).toHaveLength(4);
    expect(newColors).toContain('yellow');
  });
});

describe('immutables.removeItemInArray', () => {
  it('removeItemInArray immutably removes object from array', () => {
    const newColors = utils.removeItemInArray(state.colors, 'green');
    expect(newColors).toHaveLength(2);
    expect(newColors).toMatchSnapshot();
  });

  it('removeItemInArray resolves non-matching item and returns original state', () => {
    const newColors = utils.removeItemInArray(state.colors, 'purple');
    expect(newColors).toMatchObject(state.colors);
  });
});

describe('immutables.addItemInMap', () => {
  it('addItemInMap immutably adds object to map', () => {
    const oscar = { id: 'oscar', age: 5, color: 'black' };
    const newCats = utils.addItemInMap(state.cats, oscar);
    expect(Object.keys(newCats)).toHaveLength(4);
    expect(newCats['oscar']).toBeTruthy();
  });
});

describe('immutables.removeItemInMap', () => {
  it('removeItemInMap immutably removes object from map', () => {
    const newCats = utils.removeItemInMap(state.cats, 'mittens');
    expect(Object.keys(newCats)).toHaveLength(2);
    expect(newCats['mittens']).toBeFalsy();
  });

  it('removeItemInMap resolves non-matching item and returnS original state', () => {
    const newCats = utils.removeItemInMap(state.cats, 'tom');
    expect(newCats).toMatchObject(state.cats);
  });
});

describe('immutables.updateMatchesInMap', () => {
  it('updateMatchesInMap immutably filters and updates only specified properties of matching items', () => {
    const elderCats = utils.updateMatchesInMap(state.cats, (cat => cat.age > 10), cat => {
      return utils.updateObject(cat, { ...cat, id: 'old ' + cat.id });
    });
    expect(elderCats).toMatchSnapshot();
  });
});

describe('immutables.updateItemInMapById', () => {
  it('updateItemInMapById immutably updates only specified properties of matching item', () => {
    const agedCats = utils.updateItemInMapById(state.cats, 'scruffy', cat => {
      return utils.updateObject(cat, { ...cat, age: cat.age + 1 });
    });
    expect(agedCats['scruffy']).not.toMatchObject(state.cats['scruffy']);
    expect(agedCats).toMatchSnapshot();
  });
});