import type { FC } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@rbx/foundation-ui';
import { useLocalization, useTranslation } from '@rbx/intl';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import CollaboratorStatusTable from './CollaboratorStatusTable';
import { CollaboratorTableEmptyStateCard } from './CollaboratorTableEmptyStateCard';
import ImpactingCollaboratorTable from './ImpactingCollaboratorTable';
import type { CollaboratorData, ImpactingCollaboratorData, JoinAttempt } from './types';
import { tabSelectEvent } from './unifiedLoggerUtils';

export interface OwnerCollaboratorsViewProps {
  accessedUsers: CollaboratorData[];
  pendingAccess: ImpactingCollaboratorData[];
  joinAttempts: JoinAttempt[];
  universeId?: number;
}

enum CollaboratorTab {
  Accessed = 'accessed',
  PendingAccess = 'pending-access',
  AttemptedToJoin = 'attempted-to-join',
}

const TAB_ANALYTICS: Record<CollaboratorTab, string> = {
  [CollaboratorTab.Accessed]: 'accessed',
  [CollaboratorTab.PendingAccess]: 'pendingAccess',
  [CollaboratorTab.AttemptedToJoin]: 'attemptedToJoin',
};

const convertStringToEnum = (value: string): CollaboratorTab | undefined => {
  if (value === CollaboratorTab.Accessed.toString()) {
    return CollaboratorTab.Accessed;
  } else if (value === CollaboratorTab.PendingAccess.toString()) {
    return CollaboratorTab.PendingAccess;
  } else if (value === CollaboratorTab.AttemptedToJoin.toString()) {
    return CollaboratorTab.AttemptedToJoin;
  }
  return undefined;
};

const OwnerCollaboratorsView: FC<OwnerCollaboratorsViewProps> = ({
  accessedUsers,
  joinAttempts,
  pendingAccess,
  universeId,
}) => {
  const { translateWithNamespace } = useTranslation();
  const { locale } = useLocalization();
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const [activeTab, setActiveTab] = useState<CollaboratorTab>(() => {
    if (accessedUsers.length > 0) {
      return CollaboratorTab.Accessed;
    }
    if (pendingAccess.length > 0) {
      return CollaboratorTab.PendingAccess;
    }
    return CollaboratorTab.AttemptedToJoin;
  });

  const handleTabValueChange = useCallback(
    (value: string) => {
      const next = convertStringToEnum(value) ?? CollaboratorTab.Accessed;
      setActiveTab(next);
      unifiedLogger.logClickEvent(tabSelectEvent(universeId ?? 0, true, TAB_ANALYTICS[next]));
    },
    [unifiedLogger, universeId],
  );

  // Overall empty state is handled by the parent, so we only need to deal with individual tab
  // empty states.

  const accessedData = useMemo(
    () =>
      accessedUsers.map((collaborator) => ({
        user: collaborator,
        status: '', // TODO, waiting on trusted friends API client
      })),
    [accessedUsers],
  );

  const attemptedToJoinData = useMemo(
    () =>
      joinAttempts.map((attempt) => ({
        user: attempt.user,
        status: translateWithNamespace(
          TranslationNamespace.Creations,
          'Label.AttemptedToJoinDate',
          {
            date: new Date(attempt.timestamp).toLocaleString(locale ?? 'en-US', {
              hour12: false,
              timeZone: 'utc',
              timeZoneName: 'short',
            }),
          },
        ),
      })),
    [joinAttempts, translateWithNamespace, locale],
  );

  const accessedTable = (
    <CollaboratorStatusTable
      data={accessedData}
      universeId={universeId}
      isOwner
      tab={TAB_ANALYTICS[CollaboratorTab.Accessed]}
      emptyState={
        <CollaboratorTableEmptyStateCard
          heading={translateWithNamespace(
            TranslationNamespace.Creations,
            'Heading.AccessedEmptyState',
          )}
          description={translateWithNamespace(
            TranslationNamespace.Creations,
            'Description.AccessedEmptyState',
          )}
        />
      }
      hideStatusColumn
    />
  );
  const pendingAccessTable = (
    <ImpactingCollaboratorTable
      data={pendingAccess}
      universeId={universeId}
      isOwner
      tab={TAB_ANALYTICS[CollaboratorTab.PendingAccess]}
      emptyState={
        <CollaboratorTableEmptyStateCard
          heading={translateWithNamespace(
            TranslationNamespace.Creations,
            'Heading.PendingAccessEmptyState',
          )}
          description={translateWithNamespace(
            TranslationNamespace.Creations,
            'Description.PendingAccessEmptyState',
          )}
        />
      }
    />
  );
  const attemptedToJoinTable = (
    <CollaboratorStatusTable
      data={attemptedToJoinData}
      universeId={universeId}
      isOwner
      tab={TAB_ANALYTICS[CollaboratorTab.AttemptedToJoin]}
      emptyState={
        <CollaboratorTableEmptyStateCard
          heading={translateWithNamespace(
            TranslationNamespace.Creations,
            'Heading.AttemptedToJoinEmptyState',
          )}
          description={translateWithNamespace(
            TranslationNamespace.Creations,
            'Description.AttemptedToJoinEmptyState',
          )}
        />
      }
    />
  );

  // If both tabs have data, show the tab layout
  return (
    <Tabs
      value={activeTab}
      onValueChange={handleTabValueChange}
      variant='Inlined'
      size='Medium'
      fitBehavior='Fit'>
      <TabsList>
        <TabsTrigger value={CollaboratorTab.Accessed} className='padding-x-medium'>
          {translateWithNamespace(TranslationNamespace.Creations, 'Tab.Accessed')}
        </TabsTrigger>
        <TabsTrigger value={CollaboratorTab.PendingAccess} className='padding-x-medium'>
          {translateWithNamespace(TranslationNamespace.Creations, 'Tab.PendingAccess')}
        </TabsTrigger>
        <TabsTrigger value={CollaboratorTab.AttemptedToJoin} className='padding-x-medium'>
          {translateWithNamespace(TranslationNamespace.Creations, 'Tab.AttemptedToJoin')}
        </TabsTrigger>
      </TabsList>
      <TabsContent value={CollaboratorTab.Accessed}>{accessedTable}</TabsContent>
      <TabsContent value={CollaboratorTab.PendingAccess}>{pendingAccessTable}</TabsContent>
      <TabsContent value={CollaboratorTab.AttemptedToJoin}>{attemptedToJoinTable}</TabsContent>
    </Tabs>
  );
};

export default OwnerCollaboratorsView;
