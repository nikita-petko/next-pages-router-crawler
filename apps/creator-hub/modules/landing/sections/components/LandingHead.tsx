import React, { FunctionComponent } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { getProductionCreatorHubUrl } from '@rbx/env-utils';
import { HubMeta } from '@rbx/creator-hub-history';
import { landingOpenGraphImagePath, metadataJson } from '../constants/assetConstants';

const LandingHead: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
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
