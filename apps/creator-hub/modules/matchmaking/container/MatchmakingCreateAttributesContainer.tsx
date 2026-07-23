import React, { FunctionComponent } from 'react';
import { withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import ConfigureAttributesForm from '../components/FormComponents/ConfigureAttributesForm';

export interface MatchmakingAttributesContainerProps {}

const MatchmakingCreateAttributesContainer: FunctionComponent<
  React.PropsWithChildren<MatchmakingAttributesContainerProps>
> = () => {
  return <ConfigureAttributesForm isEditingAttribute={false} />;
};

export default withTranslation(MatchmakingCreateAttributesContainer, [
  TranslationNamespace.Creations,
  TranslationNamespace.Error,
  TranslationNamespace.Matchmaking,
]);
