import React, { useState } from 'react';
import { isDefined } from '../../containers/utils';
import { useAppSelector } from '../../store/hooks';
import metafileSelectors from '../../store/selectors/metafiles';
import { Card } from '../../store/slices/cards';

const BrowserReverse = (props: Card) => {
  const metafile = useAppSelector(state => metafileSelectors.selectById(state, props.metafile));
  const [view] = useState('metadata');

  return (
    <>
      <div className="buttons">
      </div>
      <div className="area">
        {view === 'metadata' && isDefined(metafile) ? <span>information</span> : undefined}
      </div>
    </>
  );
};

export default BrowserReverse;
