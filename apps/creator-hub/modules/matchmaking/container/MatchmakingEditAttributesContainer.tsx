import React, { FunctionComponent } from 'react';
import { withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { PageLoading } from '@modules/miscellaneous/common';
import ConfigureAttributesForm from '../components/FormComponents/ConfigureAttributesForm';
import useAttributesManagement from '../hooks/useAttributesManagement';
import AttributeType from '../enums/AttributeType';

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
