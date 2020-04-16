import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import 'ace-builds';
import AceEditor, { IMarker } from 'react-ace';
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-noconflict/ext-searchbox';
import 'ace-builds/src-noconflict/ext-beautify';
import 'ace-builds/webpack-resolver'; // resolver for dynamically loading modes, requires webpack file-loader module

import { RootState } from '../store/root';
import { UUID } from '../types';
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

const Diff: React.FunctionComponent<{ left: UUID; right: UUID }> = props => {
  const original = useSelector((state: RootState) => state.metafiles[state.cards[props.left].related[0]]);
  const updated = useSelector((state: RootState) => state.metafiles[state.cards[props.right].related[0]]);
  const [diffOutput, setDiffOutput] = useState(diff(original.content ? original.content : '', updated.content ? updated.content : ''));
  const [markers, setMarkers] = useState(extractMarkers(diffOutput));

  useEffect(() => {
    setDiffOutput(diff(original.content ? original.content : '', updated.content ? updated.content : ''));
  }, [original, updated]);

  useEffect(() => {
    setMarkers(extractMarkers(diffOutput));
  }, [diffOutput]);

  return (
    <AceEditor mode={original.filetype?.toLowerCase()} theme='github' name={original.id + '-diff'} value={diffOutput}
      className='editor' height='100%' width='100%' readOnly={true} markers={markers} showGutter={false}
      setOptions={{ useWorker: false, hScrollBarAlwaysVisible: false, vScrollBarAlwaysVisible: false }} />
  );
}

export default Diff;