import { act, renderHook } from '@testing-library/react';
import { DateTime } from 'luxon';
import { FileMetafile, Metafile, VirtualMetafile } from '../../store/slices/metafiles';
import useMap from './useMap';

const basicMetafile: FileMetafile = {
  id: '88e2gd50-3a5q-6401-b5b3-203c6710e35c',
  name: 'bar.js',
  modified: DateTime.fromISO('2015-06-19T19:10:47.319-08:00').valueOf(),
  handler: 'Editor',
  filetype: 'Javascript',
  flags: [],
  path: 'foo/bar.js',
  state: 'unmodified',
  content: 'file contents',
  mtime: DateTime.fromISO('2020-01-28T07:44:15.276-08:00').valueOf()
};

const virtualMetafile: VirtualMetafile = {
  id: 'a5a6806b-f7e1-4f13-bca1-b1440ecd4431',
  name: 'tap.js',
  modified: DateTime.fromISO('2015-06-19T19:10:47.319-08:00').valueOf(),
  handler: 'Editor',
  filetype: 'Javascript',
  flags: [],
  content: 'new content'
};

describe('containers/hooks/useMap', () => {
  it('useMap hook tracks added entries', async () => {
    const { result } = renderHook(() => useMap<string, number>([]));
    act(() => result.current.set('one', 1));
    expect(result.current.size).toEqual(1);
  });

  it('useMap hook tracks removed entries', async () => {
    const { result } = renderHook(() => useMap([['one', 1]]));
    act(() => result.current.delete('one'));
    expect(result.current.size).toEqual(0);
  });

  it('useMap hook tracks multiple updates', async () => {
    const { result } = renderHook(() => useMap([['one', 1]]));
    act(() => result.current.set('two', 2));
    act(() => result.current.set('three', 3));
    act(() => result.current.delete('two'));
    expect(result.current.size).toEqual(2);
  });

  it('useMap hook tracks objects as values', () => {
    const { result } = renderHook(() => useMap<string, Metafile>([['first', basicMetafile]]));
    act(() => result.current.set('second', virtualMetafile));
    expect(result.current.size).toEqual(2);
  });
});
