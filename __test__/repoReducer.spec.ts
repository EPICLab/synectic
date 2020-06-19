import parsePath from 'parse-path';

import { Repository } from '../src/types';
import { ActionKeys } from '../src/store/actions';
import { reposReducer } from '../src/store/reducers/repos';

describe('repoReducer', () => {
  const repos: { [id: string]: Repository } = {
    '23': {
      id: '23',
      name: 'sampleUser/myRepo',
      root: 'sampleUser/',
      corsProxy: new URL('http://www.oregonstate.edu'),
      url: parsePath('https://github.com/sampleUser/myRepo'),
      refs: ['942043', '234412', '194724'],
      oauth: 'github',
      username: 'sampleUser',
      password: '12345',
      token: '584n29dkj1683a67f302x009q164'
    }
  }

  const newRepo: Repository = {
    id: '17',
    name: 'sampleUser/forkedRepo',
    root: '/',
    corsProxy: new URL('http://www.oregonstate.edu'),
    url: parsePath('https://github.com/sampleUser/forkedRepo'),
    refs: ['601421', '843449'],
    oauth: 'github',
    username: 'sampleUser',
    password: '12345',
    token: 'a78bw2591q592s0996q1498c1284'
  }

  it('repoReducer returns default state when current state is blank', () => {
    const newRepos = reposReducer(undefined, { type: ActionKeys.ADD_REPO, id: newRepo.id, repo: newRepo });
    expect(Object.keys(newRepos)).toHaveLength(1);
    expect(newRepos).toMatchSnapshot();
  });

  it('repoReducer appends a new repo to state on action ADD_REPO', () => {
    const addedRepos = reposReducer(repos, { type: ActionKeys.ADD_REPO, id: newRepo.id, repo: newRepo });
    expect(Object.keys(addedRepos)).toHaveLength(2);
    expect(addedRepos).toMatchSnapshot();
  });

  it('repoReducer removes a repo from state on action REMOVE_REPO', () => {
    const matchedRepos = reposReducer(repos, { type: ActionKeys.REMOVE_REPO, id: '23' });
    expect(Object.keys(matchedRepos)).toHaveLength(0);
  });

  it('repoReducer resolves non-matching repo in state on action REMOVE_REPO', () => {
    const nonMatchedRepos = reposReducer(repos, { type: ActionKeys.REMOVE_REPO, id: newRepo.id });
    expect(Object.keys(nonMatchedRepos)).toHaveLength(Object.keys(repos).length);
  });

  it('repoReducer updates state of matched repo on action UPDATE_REPO', () => {
    const updatedRepos = reposReducer(repos, {
      type: ActionKeys.UPDATE_REPO, id: '23', repo: {
        oauth: 'bitbucket'
      }
    });
    expect(updatedRepos).not.toMatchObject(repos);
    expect(updatedRepos).toMatchSnapshot();
  });
});