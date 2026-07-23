import type { FunctionComponent } from 'react';
import React from 'react';
import { withTranslation } from '@rbx/intl';
import { PageLoading } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import ConfigureAttributesForm from '../components/FormComponents/ConfigureAttributesForm';
import AttributeType from '../enums/AttributeType';
import useAttributesManagement from '../hooks/useAttributesManagement';

export type MatchmakingEditAttributesContainerProps = {
  attributeType: AttributeType;
};

const MatchmakingEditAttributesContainer: FunctionComponent<
  React.PropsWithChildren<MatchmakingEditAttributesContainerProps>
> = ({ attributeType }) => {
  const { currentPlayerAttributeDetailedInfo, currentServerAttribute } = useAttributesManagement();

  if (
    (attributeType === AttributeType.Player && !currentPlayerAttributeDetailedInfo) ||
    (attributeType === AttributeType.Server && !currentServerAttribute)
  ) {
    return <PageLoading />;
  }

  return (
    <ConfigureAttributesForm
      isEditingAttribute
      attributeType={attributeType}
      currentPlayerAttribute={currentPlayerAttributeDetailedInfo}
      currentServerAttribute={currentServerAttribute}
    />
  );
};

export default withTranslation(MatchmakingEditAttributesContainer, [
  TranslationNamespace.Creations,
  TranslationNamespace.Error,
  TranslationNamespace.Matchmaking,
]);
