import { useCallback, useState, type FunctionComponent } from 'react';
import { Chip, Icon, TableCell, TableRow } from '@rbx/foundation-ui';
import { CollaboratorPill } from './CollaboratorPill';
import type { ImpactingCollaboratorData } from './types';

const MAX_COLLABORATOR_PILLS_TO_DISPLAY = 3;

export type ImpactingCollaboratorTableRowProps = {
  data: ImpactingCollaboratorData;
  onProfileClick: (userId: number) => void;
  onExpandTrustPills: () => void;
};

const ImpactingCollaboratorTableRow: FunctionComponent<ImpactingCollaboratorTableRowProps> = ({
  data,
  onProfileClick,
  onExpandTrustPills,
}) => {
  const [expanded, setExpanded] = useState(false);

  const handleExpand = useCallback(() => {
    onExpandTrustPills();
    setExpanded(true);
  }, [onExpandTrustPills]);

  const usersToShow = expanded
    ? data.impactedUsers
    : data.impactedUsers.slice(0, MAX_COLLABORATOR_PILLS_TO_DISPLAY);
  const remaining = data.impactedUsers.length - usersToShow.length;

  return (
    <TableRow>
      <TableCell>
        <CollaboratorPill onProfileClick={onProfileClick} collaborator={data.user} />
      </TableCell>
      <TableCell>
        <div className='flex items-center gap-xsmall content-emphasis'>
          <Icon name='icon-regular-circle-slash' size='Medium' />
          <span>{data.impactingCount}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className={`flex items-center gap-small ${expanded ? 'wrap' : ''}`}>
          {usersToShow.map((impactedUser) => {
            return (
              <CollaboratorPill
                key={impactedUser.userId}
                onProfileClick={onProfileClick}
                collaborator={impactedUser}
              />
            );
          })}
          {!expanded && remaining > 0 && (
            <Chip
              as='button'
              isChecked={false}
              onCheckedChange={handleExpand}
              text={`+${remaining}`}
            />
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};

export default ImpactingCollaboratorTableRow;
