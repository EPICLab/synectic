import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useDrag } from 'react-dnd';
import { CSSTransition } from 'react-transition-group';
import { Card } from '../types';
import { ActionKeys } from '../store/actions';
import FileExplorerComponent from './FileExplorer';
import Editor from './Editor';
import Diff from './Diff';
import { BrowserComponent } from './Browser';
import { RootState } from '../store/root';
import { FormControl, Select, MenuItem, Input } from '@material-ui/core';

const Header: React.FunctionComponent<{ title: string }> = props => {
  return <div className='card-header'><span>{props.title}</span>{props.children}</div>;
};

const ContentFront: React.FunctionComponent<Card> = props => {
  switch (props.type) {
    case 'Editor':
      return (<Editor metafileId={props.related[0]} />);
    case 'Diff':
      return (<Diff left={props.related[0]} right={props.related[1]} />);
    case 'Explorer':
      return (<FileExplorerComponent rootId={props.related[0]} />);
    case 'Browser':
      return (<BrowserComponent />);
    default:
      return null;
  }
};

const ContentBack: React.FunctionComponent<Card> = props => {
  return (
    <>
      <div className='git' /><BranchList {...props} />
      <span className='field'>ID:</span><span>{props.id}</span>
      <span className='field'>Name:</span><span>{props.name}</span>
    </>
  );
};

const BranchList: React.FunctionComponent<Card> = props => {
  const metafile = useSelector((state: RootState) => state.metafiles[props.related[0]]);
  const repos = useSelector((state: RootState) => state.repos);
  const [current] = useState(metafile.repo ? repos[metafile.repo] : { id: 'untracked', name: 'Untracked' });
  // return (<span>{current.name}</span>);
  return (
    <FormControl id='branch-control'>
      <Select labelId='branch-selection-name-label' id='branch-name' value={current.id}
        autoWidth={true} input={<Input />}>
        {Object.values(repos).map(repo => (
          <MenuItem selected key={repo.id} value={repo.id}>
            {repo.name}
          </MenuItem>
        ))}
        {current.name == 'untracked' &&
          <MenuItem key={'untracked'} value={'untracked'}>{'Untracked'}</MenuItem>
        }
      </Select>
    </FormControl>
  );
}

const CardComponent: React.FunctionComponent<Card> = props => {
  const [flipped, setFlipped] = useState(false);
  const dispatch = useDispatch();

  const [{ isDragging }, drag] = useDrag({
    item: { type: 'CARD', id: props.id },
    collect: monitor => ({
      item: monitor.getItem(),
      isDragging: !!monitor.isDragging()
    }),
    canDrag: !props.captured
  });

  const flip = () => {
    console.log(`flip: ${flipped} => ${!flipped}`);
    setFlipped(!flipped);
  };

  return (
    <div className='card' ref={drag} style={{ left: props.left, top: props.top, opacity: isDragging ? 0 : 1 }}>
      <Header title={props.name}>
        <button className='flip' onClick={() => flip()} />
        <button className='close' onClick={() => dispatch({ type: ActionKeys.REMOVE_CARD, id: props.id })} />
      </Header>
      <CSSTransition in={flipped} timeout={600} classNames='flip'>
        <>
          {flipped ? <div className='card-back'><ContentBack {...props} /></div> : <div className='card-front'><ContentFront {...props} /></div>}
        </>
      </CSSTransition>
    </div>
  );
};

export default CardComponent;