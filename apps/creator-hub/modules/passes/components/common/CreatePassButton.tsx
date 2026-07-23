import { memo } from 'react';
import NextLink from 'next/link';
import { Button } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { dashboard } from '@modules/miscellaneous/common/urls/creatorHub';

type Props = {
  universeId: number;
  className?: string;
};

const getCreatePassLink = dashboard.getCreatePassUrl;

function CreateDeveloperProductButton({ universeId, className }: Props) {
  const { translate } = useTranslation();

  return (
    <Button
      className={className}
      data-testid='createAssociatedItemsButton' // Keep this for legacy tests
      variant='contained'
      size='large'
      component={NextLink}
      href={getCreatePassLink(universeId)}>
      {translate('Button.CreateNewItem', {
        itemType: translate('Label.GamePass'),
      })}
    </Button>
  );
}
export default memo(CreateDeveloperProductButton);
