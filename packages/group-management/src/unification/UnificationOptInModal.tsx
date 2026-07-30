import type { FC } from 'react';
import React from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import TranslationNamespace from '../constants/TranslationNamespace';
import type { UseUnificationOptInOptions } from '../hooks/useUnificationOptIn';
import { useUnificationOptIn } from '../hooks/useUnificationOptIn';
import { ModalState } from '../utils/unificationUtils';
import { NoBreakingChangesModal } from './NoBreakingChangesModal';

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
  const { modalState, onContinue, onAskLater } = useUnificationOptIn(unificationOptions);

  if (!ready || modalState === ModalState.None) {
    return null;
  }

  return (
    <NoBreakingChangesModal
      isOpen={modalState === ModalState.NonBreaking}
      onContinue={onContinue}
      onAskLater={onAskLater}
    />
  );
};

const UnificationOptInModal = withTranslation(UnificationOptInModalInner, [
  TranslationNamespace.GroupManagement,
  TranslationNamespace.Permissions,
  TranslationNamespace.Groups,
]);

export { UnificationOptInModal };
