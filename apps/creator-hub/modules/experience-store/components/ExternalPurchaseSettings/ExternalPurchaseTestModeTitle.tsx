import { Fragment } from 'react';
import { useTranslation } from '@rbx/intl';
import { Link, Typography, useMediaQuery } from '@rbx/ui';
import { getProductionCreatorHubUrl } from '@rbx/env-utils';

const DOCUMENTATION_LINK = `${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/reference/engine/classes/MarketplaceService#ProcessReceipt`;

function ExternalPurchaseTestModeTitle() {
  const isCompactView = useMediaQuery((theme) => theme.breakpoints.down('Large'));
  const { translate, translateHTML } = useTranslation();
  return (
    <Fragment>
      <Typography variant={isCompactView ? 'h3' : 'h2'}>{translate('Heading.TestMode')}</Typography>
      <Typography variant='body2' className='description'>
        {translateHTML('Description.TestModeSubtitle', [
          {
            opening: 'linkStart',
            closing: 'linkEnd',
            content: (chunks) => (
              <Link
                href={DOCUMENTATION_LINK}
                target='_blank'
                className='link-no-bold'
                variant='body2'
                underline='always'>
                {chunks}
              </Link>
            ),
          },
        ])}
      </Typography>
    </Fragment>
  );
}

export default ExternalPurchaseTestModeTitle;
