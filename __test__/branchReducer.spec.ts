import { DateTime } from 'luxon';

import { Branch } from '../src/types';
import { branchesReducer } from '../src/store/reducers/branches';
import { ActionKeys } from '../src/store/actions';

describe('branchesReducer', () => {
  const branches: { [id: string]: Branch } = {
    '603': {
      id: '603',
      name: 'testBranch',
      repo: '23',
      location: 'local',
      status: 'unmodified',
      updated: DateTime.fromISO('2020-01-14T09:14:33.790-08:00')
    },
    '991': {
      id: '991',
      name: 'production',
      repo: '17',
      location: 'remote-only',
      status: 'added',
      updated: DateTime.fromISO('2020-06-30T19:04:09.112-08:00')
    }
  }

  const newBranch: Branch = {
    id: '805',
    name: 'bugfix/crashlog',
    repo: '23',
    location: 'remote',
    status: 'unmodified',
    updated: DateTime.fromISO('2020-07-02T12:49:52.017-08:00')
  }

  it('branchesReducer returns default state when current state is blank', () => {
    const newBranches = branchesReducer(undefined, { type: ActionKeys.ADD_BRANCH, id: newBranch.id, branch: newBranch });
    expect(Object.keys(newBranches)).toHaveLength(1);
    expect(newBranches).toMatchSnapshot();
  });

  it('branchesReducer appends a new branch to state on action ADD_BRANCH', () => {
    const addedBranches = branchesReducer(branches, { type: ActionKeys.ADD_BRANCH, id: newBranch.id, branch: newBranch });
    expect(Object.keys(addedBranches)).toHaveLength(3);
    expect(addedBranches).toMatchSnapshot();
  });

  it('branchesReducer removes a branch from state on action REMOVE_BRANCH', () => {
    const matchedBranches = branchesReducer(branches, { type: ActionKeys.REMOVE_BRANCH, id: '603' });
    expect(Object.keys(matchedBranches)).toHaveLength(1);
  });

  it('branchesReducer resolves non-matching branch in state on action REMOVE_BRANCH', () => {
    const nonMatchedBranches = branchesReducer(branches, { type: ActionKeys.REMOVE_BRANCH, id: newBranch.id });
    expect(Object.keys(nonMatchedBranches)).toHaveLength(Object.keys(branches).length);
  });

  it('branchesReducer updates state of matched branch on action UPDATE_BRANCH', () => {
    const updatedBranches = branchesReducer(branches, {
      type: ActionKeys.UPDATE_BRANCH, id: '603', branch: {
        location: 'local-only'
      }
    });
    expect(updatedBranches).not.toMatchObject(branches);
    expect(updatedBranches).toMatchSnapshot();
  });

  it('branchesReducer removes branches from state on action REMOVE_REPO', () => {
    const updatedBranches = branchesReducer(branches, { type: ActionKeys.REMOVE_REPO, id: '17' });
    expect(updatedBranches).not.toMatchObject(branches);
    expect(updatedBranches).toMatchSnapshot();
  });
});