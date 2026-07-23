import { FC } from 'react';
import { withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import Authenticated from '@modules/authentication/Authenticated';
import PermissionsTabbedContainer from './PermissionsTabbedContainer';

const PermissionsPageContainer: FC = () => {
  return (
    <Authenticated>
      <PermissionsTabbedContainer />
    </Authenticated>
  );
};

export default withTranslation(PermissionsPageContainer, [TranslationNamespace.Creations]);
