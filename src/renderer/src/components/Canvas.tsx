import { Button } from '@mui/material';
import { DateTime } from 'luxon';
import { useState } from 'react';
import Splash from './Splash';
import { useAppSelector } from '../store/hooks';
import branchSelectors from '../store/selectors/branches';
import cardSelectors from '../store/selectors/cards';
import commitSelectors from '../store/selectors/commits';
import filetypeSelectors from '../store/selectors/filetypes';
import metafileSelectors from '../store/selectors/metafiles';
import modalSelectors from '../store/selectors/modals';
import repoSelectors from '../store/selectors/repos';
import stackSelectors from '../store/selectors/stacks';

function Canvas(): JSX.Element {
  const [showSplash, toggleSplash] = useState(false);
  const metafiles = useAppSelector(state => metafileSelectors.selectAll(state));
  const cards = useAppSelector(state => cardSelectors.selectAll(state));
  const stacks = useAppSelector(state => stackSelectors.selectAll(state));
  const filetypes = useAppSelector(state => filetypeSelectors.selectAll(state));
  const modals = useAppSelector(state => modalSelectors.selectAll(state));
  const repos = useAppSelector(state => repoSelectors.selectAll(state));
  const branches = useAppSelector(state => branchSelectors.selectAll(state));
  const commits = useAppSelector(state => commitSelectors.selectAll(state));

  const showStore = () => {
    console.group(
      `%cRedux Store : ${DateTime.local().toHTTP()}`,
      'background: lightblue; color: #444; padding: 3px; border-radius: 5px;'
    );
    console.log(`STACKS [${Object.keys(stacks).length}]`, stacks);
    console.log(`CARDS [${Object.keys(cards).length}]`, cards);
    console.log(`FILETYPES [${filetypes.length}]`, filetypes);
    console.log(`METAFILES [${metafiles.length}]`, metafiles);
    console.log(`REPOS [${repos.length}]`, repos);
    console.log(`BRANCHES [${branches.length}]`, branches);
    console.log(`COMMITS [${commits.length}]`, commits);
    console.log(`MODALS [${modals.length}]`, modals);
    console.groupEnd();
  };

  return (
    <div className="container">
      <Button variant="contained" onClick={showStore}>
        Show Store
      </Button>
      <button onClick={(): void => toggleSplash(prev => !prev)}>Load Splash</button>
      {showSplash ? <Splash /> : null}
    </div>
  );
}

export default Canvas;
