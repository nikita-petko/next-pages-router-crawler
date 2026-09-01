import type { FC } from 'react';
import { withTranslation } from '@rbx/intl';
import Authenticated from '@modules/authentication/Authenticated';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import PermissionsTabbedContainer from './PermissionsTabbedContainer';

const PermissionsPageContainer: FC = () => {
  return (
    <Authenticated>
      <PermissionsTabbedContainer />
    </Authenticated>
  );
};

export default withTranslation(PermissionsPageContainer, [TranslationNamespace.Creations]);
