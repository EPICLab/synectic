import React from 'react';
import type { UUID } from '../../types';
import { Mode } from './useStyledIconButton';
import StageButton from './StageButton';
import UnstageButton from './UnstageButton';

type CommitButtonProps = {
    cardIds: UUID[],
    mode?: Mode
}

/**
 * Button for managing the staging, unstaging, and initiation of commits for VCS-tracked cards. This button tracks the
 * status of metafiles associated with the list of cards supplied via props. The button is only enabled when at least one
 * associatedd metafile has a VCS status of `*absent`, `*added`, `*undeleted`, `*modified`, `*deleted`, `added`, `modified`, 
 * `deleted`. Clicking on the `Stage` button will trigger all unstaged metafiles to have their changes staged, clicking
 * on the `Unstage` button will reverse this process for any staged metafiles, and clicking on the `Commit` button will load
 * the staged metafiles into a new CommitDialog. 
 * @param cardIds List of Card UUIDs that should be tracked by this button.
 * @param mode Optional theme mode for switching between light and dark themes.
 * @returns 
 */
const CommitButton: React.FunctionComponent<CommitButtonProps> = ({ mode = 'light', cardIds }) => {
    return (
        <>
            <StageButton cardIds={cardIds} />
            <UnstageButton cardIds={cardIds} />
            <CommitButton cardIds={cardIds} />
        </>
    );
}

export default CommitButton;