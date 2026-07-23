import type { FunctionComponent } from 'react';
import React from 'react';
import { withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import CreateGroupForm from '../components/CreateGroupForm';

const CreateGroupContainer: FunctionComponent<React.PropsWithChildren> = () => {
  return <CreateGroupForm />;
};

export default withTranslation(CreateGroupContainer, [TranslationNamespace.Organization]);
