import React, { FunctionComponent } from 'react';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { withTranslation } from '@rbx/intl';
import CreateGroupForm from '../components/CreateGroupForm';

const CreateGroupContainer: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  return <CreateGroupForm />;
};

export default withTranslation(CreateGroupContainer, [TranslationNamespace.Organization]);
