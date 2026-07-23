import type { FunctionComponent } from 'react';
import React from 'react';
import { HubMeta } from '@rbx/creator-hub-history';
import { getProductionCreatorHubUrl } from '@rbx/env-utils';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { landingOpenGraphImagePath, metadataJson } from '../constants/assetConstants';

const LandingHead: FunctionComponent<React.PropsWithChildren> = () => {
  const { translate } = useTranslation();

  return (
    <HubMeta
      title={translate('Label.MetadataTitle')}
      ogTitle={metadataJson['Label.MetadataTitle']}
      description={metadataJson['Label.MetadataDescription']}
      canonical={`${getProductionCreatorHubUrl(process.env.buildTarget)}/landing`}
      ogImage={landingOpenGraphImagePath}
    />
  );
};

export default withTranslation(LandingHead, [TranslationNamespace.Landing]);
