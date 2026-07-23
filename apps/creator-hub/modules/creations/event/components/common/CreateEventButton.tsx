import { useRouter } from 'next/router';
import type { FunctionComponent } from 'react';
import React, { useCallback } from 'react';
import { useTranslation } from '@rbx/intl';
import { AddIcon, Button } from '@rbx/ui';
import { getCreateEventUrl } from '../../utils/eventUtils';

interface CreateEventButtonProps {
  color: 'primaryBrand' | 'primary';
}

const CreateEventButton: FunctionComponent<CreateEventButtonProps> = ({ color }) => {
  const { translate } = useTranslation();
  const router = useRouter();

  const handleCreateEventButtonClick = useCallback(() => {
    const creationPath = getCreateEventUrl(`${router.query.id}`);
    router.push(creationPath);
  }, [router]);

  return (
    <Button
      data-testid='create-event-button'
      variant='contained'
      size='large'
      color={color}
      aria-label={translate('Action.EECreateEventOrUpdate')}
      onClick={handleCreateEventButtonClick}>
      <AddIcon />
      <span>
        &nbsp;
        {translate('Action.EECreateEventOrUpdate')}
      </span>
    </Button>
  );
};

export default CreateEventButton;
