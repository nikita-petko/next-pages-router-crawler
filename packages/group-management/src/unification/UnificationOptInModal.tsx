import type { FC } from 'react';
import React from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import TranslationNamespace from '../constants/TranslationNamespace';
import type { UseUnificationOptInOptions } from '../hooks/useUnificationOptIn';
import { useUnificationOptIn } from '../hooks/useUnificationOptIn';
import { ModalState } from '../utils/unificationUtils';
import { BreakingChangesModal } from './BreakingChangesModal';
import { NoBreakingChangesModal } from './NoBreakingChangesModal';
import { MigrationCompleteModal } from './UnificationCompleteModal';

export type UnificationOptInModalProps = UseUnificationOptInOptions & {
  getCreatorHubRoleUrl?: (roleId: string) => string;
  getLegacyRolesUrl?: (groupId: string) => string;
};

const UnificationOptInModalInner: FC<UnificationOptInModalProps> = ({
  getCreatorHubRoleUrl,
  getLegacyRolesUrl,
  ...unificationOptions
}) => {
  const { ready } = useTranslation();
  const { modalState, onContinue, onAskLater, onAcknowledge, breakingChanges } =
    useUnificationOptIn(unificationOptions);

  if (!ready) {
    return null;
  }

  switch (modalState) {
    case ModalState.NonBreaking:
      return <NoBreakingChangesModal isOpen onContinue={onContinue} onAskLater={onAskLater} />;
    case ModalState.Breaking:
      return (
        <BreakingChangesModal
          isOpen
          breakingChanges={breakingChanges}
          groupId={unificationOptions.groupId}
          getCreatorHubRoleUrl={getCreatorHubRoleUrl}
          getLegacyRolesUrl={getLegacyRolesUrl}
          onContinue={onContinue}
          onAskLater={onAskLater}
        />
      );
    case ModalState.Migrated:
      return <MigrationCompleteModal isOpen onAcknowledge={onAcknowledge} />;
    case ModalState.None:
    default:
      return null;
  }
};

const UnificationOptInModal = withTranslation(UnificationOptInModalInner, [
  TranslationNamespace.GroupManagement,
  TranslationNamespace.Permissions,
  TranslationNamespace.Groups,
]);

export { UnificationOptInModal };
