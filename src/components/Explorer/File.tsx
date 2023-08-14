import React from 'react';
import { UUID } from '../../store/types';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import metafileSelectors from '../../store/selectors/metafiles';
import { StyledTreeItem } from './TreeItem';
import { isFilebasedMetafile, isVersionedMetafile } from '../../store/slices/metafiles';
import { createCard } from '../../store/thunks/cards';
import { Skeleton } from '@mui/material';
import { useFilebasedMotif } from '../../containers/hooks/useMotif';
import { Description } from '@mui/icons-material';
import { isModified, isStaged, isUnmerged } from '../../containers/utils';
import { StageButton, UnstageButton } from './GitButtons';

const File = ({ id }: { id: UUID }) => {
  const metafile = useAppSelector(state => metafileSelectors.selectById(state, id));
  const motif = useFilebasedMotif(metafile);
  const skeletonWidth = 100;
  const labelButtonState =
    isVersionedMetafile(metafile) && isStaged(metafile.status)
      ? 'unstage'
      : isVersionedMetafile(metafile) &&
        (isModified(metafile.status) || isUnmerged(metafile.status))
      ? 'stage'
      : undefined;
  const dispatch = useAppDispatch();

  const handleClick = async () => {
    if (isFilebasedMetafile(metafile)) await dispatch(createCard({ path: metafile.path }));
  };

  return (
    <>
      {isFilebasedMetafile(metafile) ? (
        <StyledTreeItem
          key={id}
          nodeId={id.toString()}
          labelText={window.api.fs.extractFilename(metafile.name)}
          hoverText={metafile?.status ?? undefined}
          labelButton={
            labelButtonState === 'stage' ? (
              <StageButton
                buttonColor={motif?.color}
                tooltip="Stage changes to this file in VCS"
                metafile={metafile}
              />
            ) : labelButtonState === 'unstage' ? (
              <UnstageButton
                buttonColor={motif?.color}
                tooltip="Unstage changes to this file in VCS"
                metafile={metafile}
              />
            ) : undefined
          }
          endIcon={<Description />}
          color={motif?.color}
          onClick={handleClick}
        />
      ) : (
        <Skeleton
          variant="text"
          aria-label="loading"
          onClick={() => console.log(`Loading ${metafile?.name}`)}
          width={skeletonWidth}
        />
      )}
    </>
  );
};

export default File;
