import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { resolveUrl } from '@rbx/env-utils';
import {
  Divider,
  FeedbackBanner,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Link, Typography } from '@rbx/ui';
import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { UseOwnerCollaboratorsResult } from '../hooks/useOwnerCollaborators';
import CollaboratorsTable from './CollaboratorsTable';
import NotAgeVerifiedTable from './NotAgeVerifiedTable';

export interface OwnerCollaboratorsViewProps {
  collaboratorsData: UseOwnerCollaboratorsResult;
  universeId?: number;
}

enum CollaboratorTab {
  NeedsAction = 'needs-action',
  NotImpacting = 'not-impacting',
}

const convertStringToEnum = (value: string): CollaboratorTab | undefined => {
  if (value === CollaboratorTab.NeedsAction.toString()) {
    return CollaboratorTab.NeedsAction;
  } else if (value === CollaboratorTab.NotImpacting.toString()) {
    return CollaboratorTab.NotImpacting;
  }
  return undefined;
};

const collaboratorTabToAnalytics = (tab: CollaboratorTab): 'needsAction' | 'notImpacting' =>
  tab === CollaboratorTab.NeedsAction ? 'needsAction' : 'notImpacting';

const OwnerCollaboratorsView: FunctionComponent<OwnerCollaboratorsViewProps> = ({
  collaboratorsData,
  universeId,
}) => {
  const { translate, translateHTML } = useTranslation();
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const { needsAction, notImpacting, notAgeVerified, isLoading, error } = collaboratorsData;
  const [activeTab, setActiveTab] = useState<CollaboratorTab>(CollaboratorTab.NeedsAction);
  const loadFailureLoggedRef = useRef(false);

  const hasTooMany = error === 'TooManyCollaborators';
  const allGood = needsAction.length === 0 && notAgeVerified.length === 0 && !isLoading && !error;
  const showLoadFailure = Boolean(error) && !hasTooMany;

  useEffect(() => {
    if (!showLoadFailure) {
      loadFailureLoggedRef.current = false;
      return;
    }
    if (loadFailureLoggedRef.current) {
      return;
    }
    loadFailureLoggedRef.current = true;
    unifiedLogger.logErrorEvent({
      eventName: CreatorDashboardEventType.SafetyCollaboratorsError,
      parameters: {
        view: 'owner',
        ...(universeId !== undefined && { universeId: universeId.toString() }),
        ...(error !== undefined && { reason: error }),
      },
    });
  }, [showLoadFailure, error, universeId, unifiedLogger]);

  const handleLearnMoreClick = useCallback(() => {
    unifiedLogger.logClickEvent({
      eventName: CreatorDashboardEventType.SafetyCollaboratorsClick,
      parameters: {
        view: 'owner',
        action: 'viewDetails',
        ...(universeId !== undefined && { universeId: universeId.toString() }),
      },
    });
  }, [unifiedLogger, universeId]);

  const handleTabValueChange = useCallback(
    (value: string) => {
      const next: CollaboratorTab | undefined = convertStringToEnum(value);
      if (next === undefined) {
        // error handling
        unifiedLogger.logErrorEvent({
          eventName: CreatorDashboardEventType.SafetyCollaboratorsError,
          parameters: {
            view: 'owner',
            reason: 'Failed to change tabs',
            ...(universeId !== undefined && { universeId: universeId.toString() }),
          },
        });
        return;
      }
      setActiveTab(next);
      unifiedLogger.logClickEvent({
        eventName: CreatorDashboardEventType.SafetyCollaboratorsClick,
        parameters: {
          view: 'owner',
          action: 'selectTab',
          tab: collaboratorTabToAnalytics(next),
          ...(universeId !== undefined && { universeId: universeId.toString() }),
        },
      });
    },
    [unifiedLogger, universeId],
  );

  const descriptionBlock = useMemo(
    () => (
      <Typography variant='body1'>
        {translateHTML(
          'Label.OwnerCollaboratorsDescription' /* in TranslationNamespace.Creations */,
          [
            {
              opening: 'LinkStart',
              closing: 'LinkEnd',
              content(chunks) {
                return (
                  <Link
                    sx={{ color: 'inherit !important', textDecoration: 'underline' }}
                    href={resolveUrl(
                      'trustedConnectionsLearnMoreUrl',
                      process.env.targetEnvironment,
                      process.env.buildTarget,
                    )}
                    target='_blank'
                    rel='noopener noreferrer'
                    onClick={handleLearnMoreClick}>
                    {chunks}
                  </Link>
                );
              },
            },
          ],
        )}
      </Typography>
    ),
    [translateHTML, handleLearnMoreClick],
  );

  if (hasTooMany) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-400)' }}>
        {descriptionBlock}
        <FeedbackBanner
          title={translate('Banner.TooManyCollaborators' /* in TranslationNamespace.Creations */)}
          layout='Inline'
          variant='Standard'
          severity='Error'
        />
      </div>
    );
  }

  if (error) {
    return (
      <FailureView
        title={translate('Heading.FailedToLoadPage')}
        message={translate('Message.FailedToLoadPage')}
      />
    );
  }

  if (allGood) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-400)' }}>
        {descriptionBlock}
        <FeedbackBanner
          title={translate(
            'Banner.AllCollaboratorsCanWork' /* in TranslationNamespace.Creations */,
          )}
          layout='Inline'
          variant='Standard'
          severity='Success'
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-400)' }}>
      {descriptionBlock}
      <Tabs
        value={activeTab}
        onValueChange={handleTabValueChange}
        variant='Inlined'
        size='Medium'
        style={{ maxWidth: '100%', overflow: 'auto' }}>
        <TabsList style={{ width: 'fit-content' }}>
          <TabsTrigger value={CollaboratorTab.NeedsAction}>
            {translate('Tab.NeedsAction' /* in TranslationNamespace.Creations */)}
          </TabsTrigger>
          <TabsTrigger value={CollaboratorTab.NotImpacting}>
            {translate('Tab.NotImpactingCollaboration' /* in TranslationNamespace.Creations */)}
          </TabsTrigger>
        </TabsList>
        <Divider className='margin-bottom-small' />
        <TabsContent value={CollaboratorTab.NeedsAction}>
          <CollaboratorsTable
            data={needsAction}
            isLoading={isLoading}
            isError={error != null}
            universeId={universeId}
            tab='needsAction'
          />
          {notAgeVerified.length > 0 && <NotAgeVerifiedTable collaborators={notAgeVerified} />}
        </TabsContent>
        <TabsContent value={CollaboratorTab.NotImpacting}>
          <CollaboratorsTable
            data={notImpacting}
            isLoading={isLoading}
            isError={error != null}
            userOnly
            universeId={universeId}
            tab='notImpacting'
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default withTranslation(OwnerCollaboratorsView, [
  TranslationNamespace.Creations,
  TranslationNamespace.Error,
]) as React.FunctionComponent<OwnerCollaboratorsViewProps>;
