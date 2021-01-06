import { ReadCommitResult } from 'isomorphic-git';
import React, { useEffect, useState } from 'react';
import ReactFlow from 'react-flow-renderer';
import { useSelector } from 'react-redux';
import { currentBranch, log } from '../containers/git';
import { RootState } from '../store/root';
import { UUID } from '../types';

const elements = [
  { id: '1', type: 'input', data: { label: 'Node 1' }, position: { x: 445, y: 15 }, className: 'git-node' },
  { id: '2', data: { label: <div>Node 2</div> }, position: { x: 425, y: 182 }, className: 'git-node' },
  { id: '3', type: 'output', data: { label: 'Node 3' }, position: { x: 570, y: 220 }, className: 'git-node' },
  { id: 'e1-2', source: '1', target: '2', ArrowHeadType: 'arrow' },
  { id: 'e1-3', source: '1', target: '3', ArrowHeadType: 'arrow' },
];

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
// eslint-disable-next-line react/display-name
export default (): JSX.Element => <ReactFlow elements={elements} />;


export const GitGraph: React.FunctionComponent<{ id: UUID }> = props => {
  const repo = useSelector((state: RootState) => state.repos[props.id]);
  const [commits, setCommits] = useState<ReadCommitResult[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const branch = await currentBranch({ dir: repo.root.toString(), fullname: false });
      if (branch) {
        const data: ReadCommitResult[] = await log({ dir: repo.root, ref: branch, depth: 10 });
        console.log({ data });
        setCommits(data);
      }
    }
    fetchData();
  }, [repo, repo.root]);

  return (
    <>
      <div>{`${repo.name} (${commits.length})`}</div>
      {commits.map(c => <span key={c.oid}>{`Commit ${c.oid}\tMessage: ${c.payload}\n\n`}</span>)}
      <ReactFlow elements={elements} />
      { props.children}
    </>
  );
}