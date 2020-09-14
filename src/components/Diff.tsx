import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import 'ace-builds';
import AceEditor, { IMarker } from 'react-ace';
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-noconflict/ext-searchbox';
import 'ace-builds/src-noconflict/ext-beautify';
import 'ace-builds/webpack-resolver'; // resolver for dynamically loading modes, requires webpack file-loader module

import { RootState } from '../store/root';
import { UUID, Card } from '../types';
import { diff } from '../containers/diff';

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
  const metafile = useSelector((state: RootState) => state.metafiles[props.metafileId]);
  const original = useSelector((state: RootState) => (metafile.targets ? state.metafiles[state.cards[metafile.targets[0]]?.metafile] : undefined));
  const updated = useSelector((state: RootState) => (metafile.targets ? state.metafiles[state.cards[metafile.targets[1]]?.metafile] : undefined));

  const [diffOutput, setDiffOutput] = useState(diff(original?.content ? original.content : '', updated?.content ? updated.content : ''));
  const [markers, setMarkers] = useState(extractMarkers(diffOutput));

  useEffect(() => {
    setDiffOutput(diff(original?.content ? original.content : '', updated?.content ? updated.content : ''));
  }, [original, updated]);

  useEffect(() => {
    setMarkers(extractMarkers(diffOutput));
  }, [diffOutput]);

  return (
    <AceEditor mode={original?.filetype?.toLowerCase()} theme='github' name={original?.id + '-diff'} value={diffOutput}
      className='editor' height='100%' width='100%' readOnly={true} markers={markers} showGutter={false}
      setOptions={{ useWorker: false, hScrollBarAlwaysVisible: false, vScrollBarAlwaysVisible: false }} />
  );
};

export const DiffReverse: React.FunctionComponent<Card> = props => {
  const metafile = useSelector((state: RootState) => state.metafiles[props.metafile]);
  const original = useSelector((state: RootState) => (metafile.targets ? state.cards[metafile.targets[0]] : undefined));
  const updated = useSelector((state: RootState) => (metafile.targets ? state.cards[metafile.targets[1]] : undefined));

  return (
    <>
      <span>Name:</span><span className='field'>{metafile.name}</span>
      <span>Original:</span><span className='field'>{original ? original.name : '[Cannot locate original card]'} (...{original ? original.id.slice(-5) : '[uuid]'})</span>
      <span>Updated:</span><span className='field'>{updated ? updated.name : '[Cannot locate updated card]'} (...{updated ? updated.id.slice(-5) : '[uuid]'})</span>
    </>
  );
};

export default Diff;