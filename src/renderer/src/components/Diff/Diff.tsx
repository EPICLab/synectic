import { diff } from '@renderer/containers/diff';
import 'ace-builds';
import 'ace-builds/esm-resolver'; // resolver for dynamically loading modes, per https://github.com/mkslanc/ace-samples/blob/main/samples/ace-builds-vitejs/src/index.js
import 'ace-builds/src-noconflict/ext-beautify';
import 'ace-builds/src-noconflict/ext-searchbox';
import 'ace-builds/src-noconflict/theme-github';
import { useEffect, useState } from 'react';
import AceEditor, { IAceEditorProps, IMarker } from 'react-ace';
import type { UUID } from 'types/app';
import { useAppSelector } from '../../store/hooks';
import cardSelectors from '../../store/selectors/cards';
import metafileSelectors from '../../store/selectors/metafiles';
import { isDiffMetafile } from '../../store/slices/metafiles';
import '../Editor/EditorStyles.css';

const removeNullableProperties = window.api.utils.removeNullableProperties;

const extractMarkers = (diffOutput: string): IMarker[] => {
  const markers: IMarker[] = [];
  diffOutput.split(/\n/g).map((code, line) => {
    if (code.startsWith('+')) {
      markers.push({
        startRow: line,
        startCol: 5,
        endRow: line,
        endCol: code.length,
        className: 'ace_highlight_green',
        type: 'fullLine'
      });
    } else if (code.startsWith('-')) {
      markers.push({
        startRow: line,
        startCol: 5,
        endRow: line,
        endCol: code.length,
        className: 'ace_highlight_red',
        type: 'fullLine'
      });
    }
  });
  return markers;
};

const Diff = ({ metafileId: id }: { metafileId: UUID }) => {
  const metafile = useAppSelector(state => metafileSelectors.selectById(state, id));
  const originalCard = useAppSelector(state =>
    cardSelectors.selectById(
      state,
      isDiffMetafile(metafile) && metafile.targets[0] ? metafile.targets[0] : ''
    )
  );
  const original = useAppSelector(state =>
    metafileSelectors.selectById(state, originalCard ? originalCard.metafile : '')
  );
  const updatedCard = useAppSelector(state =>
    cardSelectors.selectById(
      state,
      isDiffMetafile(metafile) && metafile.targets[1] ? metafile.targets[1] : ''
    )
  );
  const updated = useAppSelector(state =>
    metafileSelectors.selectById(state, updatedCard ? updatedCard.metafile : '')
  );

  const [diffOutput, setDiffOutput] = useState(
    diff(original?.content ? original.content : '', updated?.content ? updated.content : '')
  );
  const [markers, setMarkers] = useState(extractMarkers(diffOutput));

  useEffect(() => {
    setDiffOutput(
      diff(original?.content ? original.content : '', updated?.content ? updated.content : '')
    );
  }, [original, updated]);

  useEffect(() => {
    setMarkers(extractMarkers(diffOutput));
  }, [diffOutput]);

  const mode = removeNullableProperties({ mode: original?.filetype?.toLowerCase() });

  return (
    <AceEditor
      {...mode}
      {...editorProps}
      name={original?.id + '-diff'}
      value={diffOutput}
      readOnly={true}
      markers={markers}
      showGutter={false}
    />
  );
};

const editorProps: IAceEditorProps = {
  className: 'editor',
  theme: 'monokai',
  height: '100%',
  width: '100%',
  focus: false,
  setOptions: {
    useWorker: false,
    selectionStyle: 'text',
    autoScrollEditorIntoView: true,
    hScrollBarAlwaysVisible: false,
    vScrollBarAlwaysVisible: false
  }
};

export default Diff;
