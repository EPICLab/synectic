import { useCallback, useState, useEffect } from 'react';
import { Card, UUID, GitStatus } from '../../types';
import { useSelector } from 'react-redux';
import { getCardsByRepo } from '../selectors/repos';
import { getStatus } from '../../containers/git';
import { RootState } from '../root';

type useGitStatusHook = [
  { cards: Card[], modified: number, status: { [cardId: string]: GitStatus } },
  { fetch: () => void }
];

const useBranchStatus = (repo: UUID, branch: string): useGitStatusHook => {
  const metafiles = useSelector((state: RootState) => state.metafiles);
  const cards = useSelector(getCardsByRepo(repo, branch));
  const [status, updateStatus] = useState<{ [cardId: string]: GitStatus }>({});
  const [modified, setModified] = useState(0);

  useEffect(() => {
    if (cards.length > 0) console.log(`card length (${cards.length}) changed for branch ${branch}`);
    else console.log(`card length is zero for branch ${branch}`);
  }, [branch, cards]);

  useEffect(() => {
    console.log(`modified: ${modified}`)
  }, [modified]);

  const fetch = useCallback(() => {
    const updates = Object.assign({}, status);

    const statusCheck = async (card: Card) => {
      const metafile = metafiles[card.related[0]];
      return metafile.path ? await getStatus(metafile.path.toString()) : null;
    }

    Promise.all(cards.map(async card => {
      const cardStatus = await statusCheck(card);
      if (cardStatus !== null) {
        updates[card.id] = cardStatus;
      }
    })).then(() => {
      console.log(`${branch} fetch => cards: ${cards.length}\n  updated: ${JSON.stringify(updates)}`);
      updateStatus(updates);
      setModified(Object.values(status).filter(s => !['modified', '*modified', 'deleted', '*deleted', 'added', '*added', '*absent', '*undeleted', '*undeletedmodified'].includes(s)).length);
    });
  }, [branch, cards, metafiles, status]);

  return [{ cards, modified, status }, { fetch }];
}

export default useBranchStatus;