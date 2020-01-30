import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/root';
import { UUID } from '../types';
import 'ace-builds';
import { diff as DiffEditor } from "react-ace";
import 'ace-builds/src-noconflict/theme-monokai';

const Diff: React.FunctionComponent<{ left: UUID; right: UUID }> = props => {
  const leftMetafile = useSelector((state: RootState) => state.metafiles[props.left]);
  const rightMetafile = useSelector((state: RootState) => state.metafiles[props.right]);
  const leftContent = (leftMetafile && leftMetafile.content) ? leftMetafile.content : '';
  const rightContent = (rightMetafile && rightMetafile.content) ? rightMetafile.content : '';

  useEffect(() => {
    console.log(`Diff leftMetafile: ${JSON.stringify(leftMetafile)}`);
    console.log(`Diff rightMetafile: ${JSON.stringify(rightMetafile)}`);
  }, [leftMetafile, rightMetafile]);

  return (
    <DiffEditor mode={leftMetafile.filetype} theme='monokai' value={[leftContent, rightContent]}
      height='calc(100% - 29px)' width='100%' />
  );
}

export default Diff;