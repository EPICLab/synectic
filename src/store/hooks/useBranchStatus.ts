import { useCallback, useState } from 'react';
import { Card, UUID, GitStatus } from '../../types';
import { useSelector } from 'react-redux';
import { getCardsByRepo } from '../selectors/repos';
import { getStatus } from '../../containers/git';
import { RootState } from '../root';

const modifiedStatuses = ['modified', '*modified', 'deleted', '*deleted', 'added', '*added', '*absent', '*undeleted', '*undeletedmodified'];

type useGitStatusHook = {
  cards: Card[],
  modified: Card[],
  status: (card: Card) => Promise<GitStatus | null>, // a null return is indicative of a Card not under version control
};

export const useBranchStatus = (repo: UUID, branch: string): useGitStatusHook => {
  const metafiles = useSelector((state: RootState) => state.metafiles);
  const cards = useSelector(getCardsByRepo(repo, branch));
  const [modified, setModified] = useState<Card[]>([]);

  const status = useCallback(async (card: Card) => {
    const metafile = metafiles[card.metafile];
    const updatedStatus = metafile.path ? await getStatus(metafile.path.toString()) : null;
    if (updatedStatus && modifiedStatuses.includes(updatedStatus)) {
      setModified([...modified, card]);
    } else {
      setModified(modified.filter(c => c.id !== card.id));
    }
    return updatedStatus;
  }, [metafiles, modified]);

  return { cards, modified, status };
}