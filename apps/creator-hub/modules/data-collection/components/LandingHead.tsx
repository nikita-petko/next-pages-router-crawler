import type { FunctionComponent } from 'react';
import React from 'react';
import { HubMeta } from '@rbx/creator-hub-history';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { metadataJson } from '../constants/assetConstants';

const LandingHead: FunctionComponent<React.PropsWithChildren> = () => {
  const { translate } = useTranslation();

  return (
    <HubMeta
      title={translate('Heading.Metadata')}
      ogTitle={metadataJson['Heading.Metadata']}
      description={metadataJson['Description.Metadata']}
    />
  );
};

export default withTranslation(LandingHead, [TranslationNamespace.DataCollection]);
