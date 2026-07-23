import { useTranslation } from '@rbx/intl';
import { AddIcon, Button } from '@rbx/ui';
import React, { FunctionComponent, useCallback } from 'react';
import { useRouter } from 'next/router';
import { getCreateEventUrl } from '../../utils/eventUtils';

interface CreateEventButtonProps {
  color: 'primaryBrand' | 'primary';
}

const CreateEventButton: FunctionComponent<CreateEventButtonProps> = ({
  color = 'primaryBrand',
}) => {
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
