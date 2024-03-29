import {extractFilename, isModified, isStaged, isUnmerged, uuid} from '#preload';
import {Description} from '@mui/icons-material';
import {Skeleton} from '@mui/material';
import type {UUID} from '@syn-types/app';
import {useFilebasedMotif} from '../../containers/hooks/useMotif';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import metafileSelectors from '../../store/selectors/metafiles';
import {isFilebasedMetafile, isVersionedMetafile} from '../../store/slices/metafiles';
import {createCard} from '../../store/thunks/cards';
import {StageButton, UnstageButton} from './GitButtons';
import {StyledTreeItem} from './TreeItem';
import {modalAdded} from '/@/store/slices/modals';

const File = ({id}: {id: UUID}) => {
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
    if (isFilebasedMetafile(metafile)) await dispatch(createCard({path: metafile.path}));
  };

  const handleRightClick = () => {
    if (isFilebasedMetafile(metafile))
      dispatch(
        modalAdded({
          id: uuid(),
          type: 'DeleteFileDialog',
          metafile: metafile.id,
        }),
      );
  };

  return (
    <>
      {isFilebasedMetafile(metafile) ? (
        <StyledTreeItem
          key={id}
          nodeId={id.toString()}
          labelText={extractFilename(metafile.name)}
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
          onContextMenu={handleRightClick}
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
