import { act, renderHook } from '@testing-library/react-hooks';
import useMap from './useMap';
import { Metafile } from '../../store/slices/metafiles';
import { basicMetafile, virtualMetafile } from '../../../__test__/__fixtures__/Metafile';

describe('containers/hooks/useMap', () => {

    it('useMap hook tracks added entries', async () => {
        const { result } = renderHook(() => useMap<string, number>([]));
        act(() => result.current[1].set('one', 1));
        expect(result.current[0].size).toEqual(1);
    });

    it('useMap hook tracks removed entries', async () => {
        const { result } = renderHook(() => useMap<string, number>([['one', 1]]));
        act(() => result.current[1].remove('one'));
        expect(result.current[0].size).toEqual(0);
    });

    it('useMap hook tracks multiple updates', async () => {
        const { result } = renderHook(() => useMap<string, number>([['one', 1]]));
        act(() => result.current[1].set('two', 2));
        act(() => result.current[1].set('three', 3));
        act(() => result.current[1].remove('two'));
        expect(result.current[0].size).toEqual(2);
    });

    it('useMap hook tracks objects as values', () => {
        const { result } = renderHook(() => useMap<string, Metafile>([['first', basicMetafile]]));
        act(() => result.current[1].set('second', virtualMetafile));
        expect(result.current[0].size).toEqual(2);
    });
});
