import type { FunctionComponent } from 'react';
import React from 'react';
import { HubMeta } from '@rbx/creator-hub-history';
import { getProductionCreatorHubUrl } from '@rbx/env-utils';
import { useTranslation } from '@rbx/intl';
import { metadataPath } from '../constants/assetConstants';
import { metadataConstants } from '../constants/contentConstants';

const DeveloperLandingHead: FunctionComponent<React.PropsWithChildren> = () => {
  const { translate } = useTranslation();

  return (
    <HubMeta
      title={translate('Label.MetadataTitle')}
      ogTitle={metadataConstants.title}
      description={metadataConstants.description}
      canonical={`${getProductionCreatorHubUrl(process.env.buildTarget)}/creator`}
      ogImage={metadataPath}
    />
  );
};

export default DeveloperLandingHead;
