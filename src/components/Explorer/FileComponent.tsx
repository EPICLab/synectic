import { DeleteForever as Delete, InsertDriveFile as FileIcon } from '@material-ui/icons';
import { Skeleton } from '@material-ui/lab';
import { remove as removePath } from 'fs-extra';
import React from 'react';
import { useFileMotif } from '../../containers/hooks/useMotif';
import { extractFilename } from '../../containers/io';
import { getRandomInt, isDefined, removeNullableProperties } from '../../containers/utils';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import metafileSelectors from '../../store/selectors/metafiles';
import { isFileMetafile, isFilebasedMetafile } from '../../store/slices/metafiles';
import { buildCard } from '../../store/thunks/cards';
import { UUID } from '../../store/types';
import { StyledTreeItem } from '../StyledTreeComponent';

const FileComponent = ({ metafileId: id }: { metafileId: UUID }) => {
  const metafile = useAppSelector(state => metafileSelectors.selectById(state, id));
  const motif = useFileMotif(metafile);
  const dispatch = useAppDispatch();

  const onHoverText =
    isDefined(metafile) && metafile.status !== 'unmodified' ? metafile.status : undefined;
  const optionals = removeNullableProperties({ color: motif?.color, onHoverText: onHoverText });
  const skeletonWidth = metafile ? Math.min(metafile.name.length * 15, 245) : getRandomInt(55, 220);

  const handleClick = async () => {
    if (isFilebasedMetafile(metafile) && metafile.state != 'unlinked')
      await dispatch(buildCard({ path: metafile.path }));
  };

  const handleInfoClick = async (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    e.stopPropagation(); // prevent propogating the click event to the StyleTreeItem onClick method
    if (isFilebasedMetafile(metafile)) await removePath(metafile.path.toString());
  };

  // expects a TreeView parent to encompass the StyledTreeItem below
  return (
    <>
      {isFilebasedMetafile(metafile) && isFileMetafile(metafile) ? (
        <StyledTreeItem
          key={metafile.id}
          nodeId={metafile.id}
          labelText={extractFilename(metafile.path)}
          {...optionals}
          labelInfo={Delete}
          labelInfoClickHandler={handleInfoClick}
          labelIcon={FileIcon}
          enableHover={true}
          onClick={handleClick}
        />
      ) : (
        <Skeleton variant="text" aria-label="loading" width={skeletonWidth} />
      )}
    </>
  );
};

export default FileComponent;
