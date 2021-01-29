import { DateTime } from 'luxon';

import type { Metafile } from '../src/types';
import { ActionKeys } from '../src/store/actions';
import { metafileReducer } from '../src/store/reducers/metafiles';

describe('metafileReducer', () => {
  const metafiles: { [id: string]: Metafile } = {
    '541': {
      id: '541',
      name: 'test.js',
      path: './sample/test.js',
      filetype: 'JavaScript',
      handler: 'Editor',
      modified: DateTime.fromISO('2019-12-01T11:14:08.572-08:00', { setZone: true }),
      content: 'sample content from test.js',
      repo: '13',
      branch: '9'
    }
  };

  const newMetafile: Metafile = {
    id: '788',
    name: 'addition.ts',
    path: './sample/addition.ts',
    filetype: 'TypeScript',
    handler: 'Editor',
    modified: DateTime.fromISO('2019-12-20T01:01:01.572-08:00', { setZone: true }),
    content: 'sample content from addition.ts'
  }

  it('metafileReducer appends a new metafile to state on action ADD_METAFILE', () => {
    const addedMetafiles = metafileReducer(metafiles, { type: ActionKeys.ADD_METAFILE, id: newMetafile.id, metafile: newMetafile });
    expect(Object.keys(metafiles)).toHaveLength(1);
    expect(Object.keys(addedMetafiles)).toHaveLength(2);
  });

  it('metafileReducer removes a metafile from state on action REMOVE_METAFILE', () => {
    const matchedMetafiles = metafileReducer(metafiles, { type: ActionKeys.REMOVE_METAFILE, id: '541' });
    expect(Object.keys(matchedMetafiles)).toHaveLength(0);
  });

  it('metafileReducer resolves non-matching metafile in state on action REMOVE_METAFILE', () => {
    const nonMatchedMetafiles = metafileReducer(metafiles, { type: ActionKeys.REMOVE_METAFILE, id: '100' });
    expect(Object.keys(nonMatchedMetafiles)).toHaveLength(Object.keys(metafiles).length);
  });

  it('metafileReducer updates state of matched metafile on action UPDATE_METAFILE', () => {
    const updatedMetafiles = metafileReducer(metafiles, {
      type: ActionKeys.UPDATE_METAFILE, id: '541', metafile: {
        modified: DateTime.fromISO('2019-12-21T20:45:13.131-08:00', { setZone: true }),
        content: 'updated sample of content from test.js'
      }
    });
    expect(updatedMetafiles).not.toMatchObject(metafiles);
    expect(updatedMetafiles).toMatchSnapshot();
  });

  it('metafileReducer updates state of matched metafile on action REOMVE_REPO', () => {
    const updatedMetafiles = metafileReducer(metafiles, { type: ActionKeys.REMOVE_REPO, id: '13' });
    expect(updatedMetafiles[541].repo).toBeUndefined();
  });
});