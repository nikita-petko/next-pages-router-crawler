import type { FC } from 'react';
import { useCallback, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { CollaboratorTableEmptyStateCard } from './CollaboratorTableEmptyStateCard';
import ImpactingCollaboratorTable from './ImpactingCollaboratorTable';
import type { ImpactingCollaboratorData } from './types';
import { tabSelectEvent } from './unifiedLoggerUtils';

export interface MemberCollaboratorsViewProps {
  impactingMe: ImpactingCollaboratorData[];
  impactingOthers: ImpactingCollaboratorData[];
  universeId?: number;
}

enum CollaboratorTab {
  ImpactingMe = 'impacting-me',
  ImpactingOthers = 'impacting-others',
}

const TAB_ANALYTICS: Record<CollaboratorTab, string> = {
  [CollaboratorTab.ImpactingMe]: 'impactingMe',
  [CollaboratorTab.ImpactingOthers]: 'impactingOthers',
};

const convertStringToEnum = (value: string): CollaboratorTab | undefined => {
  if (value === CollaboratorTab.ImpactingMe.toString()) {
    return CollaboratorTab.ImpactingMe;
  } else if (value === CollaboratorTab.ImpactingOthers.toString()) {
    return CollaboratorTab.ImpactingOthers;
  }
  return undefined;
};

const EditorCollaboratorsView: FC<MemberCollaboratorsViewProps> = ({
  impactingMe,
  impactingOthers,
  universeId,
}) => {
  const { translateWithNamespace } = useTranslation();
  const { unifiedLogger } = useUnifiedLoggerProvider();

  const [activeTab, setActiveTab] = useState<CollaboratorTab>(
    impactingMe.length ? CollaboratorTab.ImpactingMe : CollaboratorTab.ImpactingOthers,
  );

  const handleTabValueChange = useCallback(
    (value: string) => {
      const next = convertStringToEnum(value) ?? CollaboratorTab.ImpactingMe;
      setActiveTab(next);
      unifiedLogger.logClickEvent(tabSelectEvent(universeId ?? 0, false, TAB_ANALYTICS[next]));
    },
    [unifiedLogger, universeId],
  );

  return (
    <Tabs
      value={activeTab}
      onValueChange={handleTabValueChange}
      variant='Inlined'
      size='Medium'
      fitBehavior='Fit'>
      <TabsList>
        <TabsTrigger value={CollaboratorTab.ImpactingMe} className='padding-x-medium'>
          {translateWithNamespace(TranslationNamespace.Creations, 'Tab.ImpactingMe')}
        </TabsTrigger>
        <TabsTrigger value={CollaboratorTab.ImpactingOthers} className='padding-x-medium'>
          {translateWithNamespace(TranslationNamespace.Creations, 'Tab.ImpactingOthers')}
        </TabsTrigger>
      </TabsList>
      <TabsContent value={CollaboratorTab.ImpactingMe}>
        <ImpactingCollaboratorTable
          data={impactingMe}
          universeId={universeId}
          isOwner={false}
          tab={TAB_ANALYTICS[CollaboratorTab.ImpactingMe]}
          emptyState={
            <CollaboratorTableEmptyStateCard
              heading={translateWithNamespace(
                TranslationNamespace.Creations,
                'Heading.ImpactingMeEmptyState',
              )}
              description={translateWithNamespace(
                TranslationNamespace.Creations,
                'Description.ImpactingMeEmptyState',
              )}
            />
          }
        />
      </TabsContent>
      <TabsContent value={CollaboratorTab.ImpactingOthers}>
        <ImpactingCollaboratorTable
          data={impactingOthers}
          universeId={universeId}
          isOwner={false}
          tab={TAB_ANALYTICS[CollaboratorTab.ImpactingOthers]}
          emptyState={
            <CollaboratorTableEmptyStateCard
              heading={translateWithNamespace(
                TranslationNamespace.Creations,
                'Heading.ImpactingOthersEmptyState',
              )}
              description={translateWithNamespace(
                TranslationNamespace.Creations,
                'Description.ImpactingOthersEmptyState',
              )}
            />
          }
        />
      </TabsContent>
    </Tabs>
  );
};

export default EditorCollaboratorsView;
