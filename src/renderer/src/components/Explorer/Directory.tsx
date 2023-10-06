import { Skeleton } from '@mui/material';
import type { UUID } from 'types/app';
import { useFilebasedMotif } from '../../containers/hooks/useMotif';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import metafileSelectors from '../../store/selectors/metafiles';
import { isDirectoryMetafile } from '../../store/slices/metafiles';
import { updateDirectoryMetafile } from '../../store/thunks/metafiles';
import File from './File';
import { StageButton, UnstageButton } from './GitButtons';
import { StyledTreeItem } from './TreeItem';

const getRandomInt = window.api.utils.getRandomInt;

const Directory = ({ id, expanded }: { id: UUID; expanded: string[] }) => {
  const metafile = useAppSelector(state => metafileSelectors.selectById(state, id));
  const isExpanded = expanded.includes(id.toString());
  const directories = useAppSelector(state =>
    metafileSelectors.selectDirectories(state, metafile?.contains ?? [])
  );
  const files = useAppSelector(state =>
    metafileSelectors.selectFiles(state, metafile?.contains ?? [])
  );
  const motif = useFilebasedMotif(metafile);
  const dispatch = useAppDispatch();

  const clickHandle = async () => {
    if (!isExpanded && isDirectoryMetafile(metafile))
      await dispatch(updateDirectoryMetafile({ id: metafile.id }));
  };

  return (
    <>
      {isDirectoryMetafile(metafile) ? (
        <StyledTreeItem
          key={id}
          nodeId={id.toString()}
          labelText={metafile.name}
          hoverText={metafile?.status ?? undefined}
          labelButton={
            motif.actionable === 'unstaged' ? (
              <StageButton
                buttonColor={motif?.color}
                tooltip="Stage changes to this directory in VCS"
                metafile={metafile}
              />
            ) : motif.actionable === 'staged' ? (
              <UnstageButton
                buttonColor={motif?.color}
                tooltip="Unstage changes to this directory in VCS"
                metafile={metafile}
              />
            ) : undefined
          }
          color={motif?.color}
          onClick={clickHandle}
        >
          {directories
            .sort((a, b) => a.name.localeCompare(b.name))
            .filter(dir => !dir.name.startsWith('.'))
            .map(dir => (
              <Directory key={dir.id} id={dir.id} expanded={expanded} />
            ))}
          {files
            .sort((a, b) => a.name.localeCompare(b.name))
            .filter(dir => !dir.name.startsWith('.'))
            .map(file => (
              <File key={file.id} id={file.id} />
            ))}
        </StyledTreeItem>
      ) : (
        <Skeleton
          variant="text"
          aria-label="loading"
          onClick={() => console.log(`Loading ${metafile?.name}`)}
          width={metafile ? Math.min(metafile.name.length * 15, 245) : getRandomInt(55, 220)}
        />
      )}
    </>
  );
};

export default Directory;
