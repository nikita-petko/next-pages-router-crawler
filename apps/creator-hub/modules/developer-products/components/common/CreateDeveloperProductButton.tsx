import NextLink from 'next/link';
import { memo } from 'react';
import { useTranslation } from '@rbx/intl';
import { Button } from '@rbx/ui';
import { dashboard } from '@modules/miscellaneous/urls/creatorHub';

type Props = {
  universeId: number;
  className?: string;
};

const getCreateDeveloperProductLink = dashboard.getCreateDeveloperProductUrl;

function CreateDeveloperProductButton({ universeId, className }: Props) {
  const { translate } = useTranslation();

  return (
    <Button
      className={className}
      data-testid='createAssociatedItemsButton' // Keep this for legacy tests
      variant='contained'
      size='large'
      component={NextLink}
      href={getCreateDeveloperProductLink(universeId)}>
      {translate('Button.CreateNewItem', {
        itemType: translate('Label.DeveloperProduct'),
      })}
    </Button>
  );
}
export default memo(CreateDeveloperProductButton);
