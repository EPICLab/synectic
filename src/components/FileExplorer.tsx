import React, { useState, useEffect } from 'react';
// import * as io from '../containers/io';
import { generateTreeNodeObject } from '../containers/explorer';
import { PathLike } from 'fs-extra';

interface FileTreeProps {
  path: PathLike;
}

export const FileTreeComponent: React.FunctionComponent<FileTreeProps> = (props: FileTreeProps) => {
  const [files, setFiles] = useState<string[]>([]);

  useEffect(() => {
    async function fetchData() {
      generateTreeNodeObject(props.path)
        .then(result => process.stdout.write(`RESULT: ${result}` + '\n'))
        .catch(error => process.stdout.write(`ERROR: ${error}` + '\n'));
      setFiles(['res']);
    }

    fetchData();
  }, [props.path]);

  return (
    <>
      <ul>
        {files.map((f, i) => <li key={i}>{f}</li>)}
        Path: {props.path}
      </ul>
    </>
  );
}

/**
 *       {files.map((file: TreeNode) => {
        {
          file.isFileBool ?
            <li key={file.filePath + ' Directory'}>{`${io.extractFilename(file.filePath)}`}
              <Component<TreeNode> filePath={file.filePath} files={file.files} isFileBool={file.isFileBool} />}
           </li>
            :
            <li key={file.filePath}>{`${io.extractFilename(file.filePath)}`}</li>;
        }
      })
      }
 */