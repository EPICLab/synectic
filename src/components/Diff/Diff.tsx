import React, { useState, useEffect } from 'react';
import 'ace-builds';
import AceEditor, { IMarker } from 'react-ace';
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-noconflict/ext-searchbox';
import 'ace-builds/src-noconflict/ext-beautify';
import 'ace-builds/webpack-resolver'; // resolver for dynamically loading modes, requires webpack file-loader module

import { diff } from '../../containers/diff';
import { useAppSelector } from '../../store/hooks';
import metafileSelectors from '../../store/selectors/metafiles';
import cardSelectors from '../../store/selectors/cards';
import { removeUndefinedProperties } from '../../containers/utils';
import { UUID } from '../../store/types';

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

const Diff = ({ metafileId: id }: { metafileId: UUID }) => {
  const metafile = useAppSelector(state => metafileSelectors.selectById(state, id));
  const originalCard = useAppSelector(state => cardSelectors.selectById(state, metafile?.targets?.[0] ? metafile.targets[0] : ''));
  const original = useAppSelector(state => metafileSelectors.selectById(state, originalCard ? originalCard.metafile : ''));
  const updatedCard = useAppSelector(state => cardSelectors.selectById(state, metafile?.targets?.[1] ? metafile.targets[1] : ''));
  const updated = useAppSelector(state => metafileSelectors.selectById(state, updatedCard ? updatedCard.metafile : ''));

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

export default Diff;