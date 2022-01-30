import React, { useState, useEffect } from 'react';
import 'ace-builds';
import AceEditor, { IMarker } from 'react-ace';
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-noconflict/ext-searchbox';
import 'ace-builds/src-noconflict/ext-beautify';
import 'ace-builds/webpack-resolver'; // resolver for dynamically loading modes, requires webpack file-loader module

import type { Card, UUID } from '../../types';
import { RootState } from '../../store/store';
import { diff } from '../../containers/diff';
import { useAppSelector } from '../../store/hooks';
import metafileSelectors from '../../store/selectors/metafiles';
import cardSelectors from '../../store/selectors/cards';
import { removeUndefinedProperties } from '../../containers/format';

const extractMarkers = (diffOutput: string): IMarker[] => {
  const markers: IMarker[] = [];
  diffOutput.split(/\n/g).map((code, line) => {
    if (code.startsWith('+')) {
      markers.push({ startRow: line, startCol: 5, endRow: line, endCol: code.length, className: 'ace_highlight_green', type: 'fullLine' });
    } else if (code.startsWith('-')) {
      markers.push({ startRow: line, startCol: 5, endRow: line, endCol: code.length, className: 'ace_highlight_red', type: 'fullLine' });
    }
  });
  return markers;
};

const Diff: React.FunctionComponent<{ metafileId: UUID }> = props => {
  const metafile = useAppSelector((state: RootState) => metafileSelectors.selectById(state, props.metafileId));
  const originalCard = useAppSelector((state: RootState) => cardSelectors.selectById(state, metafile?.targets?.[0] ? metafile.targets[0] : ''));
  const original = useAppSelector((state: RootState) => metafileSelectors.selectById(state, originalCard ? originalCard.metafile : ''));
  const updatedCard = useAppSelector((state: RootState) => cardSelectors.selectById(state, metafile?.targets?.[1] ? metafile.targets[1] : ''));
  const updated = useAppSelector((state: RootState) => metafileSelectors.selectById(state, updatedCard ? updatedCard.metafile : ''));

  const [diffOutput, setDiffOutput] = useState(diff(original?.content ? original.content : '', updated?.content ? updated.content : ''));
  const [markers, setMarkers] = useState(extractMarkers(diffOutput));

  useEffect(() => {
    setDiffOutput(diff(original?.content ? original.content : '', updated?.content ? updated.content : ''));
  }, [original, updated]);

  useEffect(() => {
    setMarkers(extractMarkers(diffOutput));
  }, [diffOutput]);

  const mode = removeUndefinedProperties({ mode: original?.filetype?.toLowerCase() });

  return (
    <AceEditor {...mode} theme='github' name={original?.id + '-diff'} value={diffOutput}
      className='editor' height='100%' width='100%' readOnly={true} markers={markers} showGutter={false}
      setOptions={{ useWorker: false, hScrollBarAlwaysVisible: false, vScrollBarAlwaysVisible: false }} />
  );
};

export const DiffReverse: React.FunctionComponent<Card> = props => {
  const metafile = useAppSelector((state: RootState) => metafileSelectors.selectById(state, props.metafile));
  const original = useAppSelector((state: RootState) => cardSelectors.selectById(state, metafile?.targets?.[0] ? metafile.targets[0] : ''));
  const updated = useAppSelector((state: RootState) => cardSelectors.selectById(state, metafile?.targets?.[1] ? metafile.targets[1] : ''));

  return (
    <>
      <span>Name:</span><span className='field'>{metafile ? metafile.name : ''}</span>
      <span>Original:</span><span className='field'>{original ? original.name :
        '[Cannot locate original card]'} (...{original ? original.id.slice(-5) : '[uuid]'})</span>
      <span>Updated:</span><span className='field'>{updated ? updated.name :
        '[Cannot locate updated card]'} (...{updated ? updated.id.slice(-5) : '[uuid]'})</span>
    </>
  );
};

export default Diff;