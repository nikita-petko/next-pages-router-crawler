import React, { FunctionComponent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { withTranslation, useTranslation, useLocalization } from '@rbx/intl';
import {
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  FeedbackBanner,
  SystemBanner,
} from '@rbx/foundation-ui';
import { useRouter } from 'next/router';
import { MetadataStatus } from '@modules/clients/experienceQuestionnaire';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { Link } from '@modules/miscellaneous/common';
import { V2Beta1ModerationStatus } from '@rbx/clients/experienceGuidelinesService/v1';
import type { ActivityEvent } from '../../interfaces/types';
import Timeline from './Timeline';
import RatingsContent, { type BadgeStatus } from './RatingsContent';
import ModerationFeedbackDialog from './ModerationFeedbackDialog';
import {
  useActivityLog,
  useActivityLogById,
  useDetailedGuidelinesV2,
  useMetadataStatus,
  useQuestionnairePublishStatusList,
} from '../../utils/queries';

interface QuestionnaireOverviewV2Props {
  universeId: number;
  onStartQuestionnaire: () => void;
  showSubmissionSuccessAlert: boolean;
  onDismissSubmissionSuccessAlert: () => void;
}

const QuestionnaireOverviewV2: FunctionComponent<QuestionnaireOverviewV2Props> = ({
  universeId,
  onStartQuestionnaire,
  showSubmissionSuccessAlert,
  onDismissSubmissionSuccessAlert,
}) => {
  const { translate, translateHTML } = useTranslation();
  const { locale } = useLocalization();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('ratings');
  const [showInfoBanner, setShowInfoBanner] = useState(true);
  const [showModerationBanner, setShowModerationBanner] = useState(true);
  const [isModerationDialogOpen, setIsModerationDialogOpen] = useState(false);
  const deepLinkHandled = useRef(false);
  const [deepLinkEvent, setDeepLinkEvent] = useState<ActivityEvent | null>(null);

  const activityLogId =
    typeof router.query.activityLogId === 'string' ? router.query.activityLogId : undefined;

  const { data: activityEvents = [] } = useActivityLog(universeId);
  const { data: deepLinkActivityData } = useActivityLogById(universeId, activityLogId);

  useEffect(() => {
    if (deepLinkHandled.current || !activityLogId || !deepLinkActivityData) {
      return;
    }
    deepLinkHandled.current = true;
    setActiveTab('activity');
    setDeepLinkEvent(deepLinkActivityData);
  }, [activityLogId, deepLinkActivityData]);

  const handleSelectedEventChange = useCallback(
    async (event: ActivityEvent | null) => {
      const { activityLogId: _removed, ...restQuery } = router.query;
      await router.replace(
        {
          pathname: router.pathname,
          query: event ? { ...restQuery, activityLogId: event.id } : restQuery,
        },
        undefined,
        { shallow: true },
      );
    },
    [router],
  );
  const { data: detailedGuidelines } = useDetailedGuidelinesV2(universeId);
  const { data: metadataStatusData } = useMetadataStatus(universeId);
  const { data: publishStatusListData, isLoading: isPublishStatusLoading } =
    useQuestionnairePublishStatusList(universeId);

  const { ratingsStatus, nonCompliantRegionStatus } = useMemo<{
    ratingsStatus: BadgeStatus;
    nonCompliantRegionStatus: BadgeStatus;
  }>(() => {
    const statuses = publishStatusListData?.statuses;
    if (!statuses || statuses.length === 0) {
      return { ratingsStatus: 'NotStarted', nonCompliantRegionStatus: 'NotStarted' };
    }

    const latestStatus = statuses[0];
    const externalState = latestStatus.externalState?.toLowerCase();

    let derivedRatingsStatus: BadgeStatus = 'NotStarted';
    if (externalState === 'assigned') {
      derivedRatingsStatus = 'Assigned';
    } else if (externalState === 'pending') {
      derivedRatingsStatus = 'Pending';
    } else if (externalState === 'rejected') {
      derivedRatingsStatus = 'Rejected';
    }

    return {
      ratingsStatus: derivedRatingsStatus,
      nonCompliantRegionStatus: derivedRatingsStatus,
    };
  }, [publishStatusListData]);
  const isMetadataIncomplete = metadataStatusData?.status === MetadataStatus.Incomplete;

  const moderation = detailedGuidelines?.moderation;
  const hasModerationFeedback = moderation?.moderationStatus === V2Beta1ModerationStatus.Rejected;

  return (
    <div className='flex flex-col gap-xxlarge'>
      {showSubmissionSuccessAlert && (
        <FeedbackBanner
          title={translate('Alert.QuestionnaireSubmittedTitle')}
          description={translate('Alert.QuestionnaireSubmittedResponse')}
          layout='Inline'
          variant='Standard'
          severity='Success'
          onDismiss={onDismissSubmissionSuccessAlert}
        />
      )}

      <div>
        <span className='text-body-medium'>
          {translateHTML('Description.IARCQuestionnaireOverviewMarch', [
            {
              opening: 'maturityRatingLinkStart',
              closing: 'maturityRatingLinkEnd',
              content(chunks: React.ReactNode) {
                return (
                  <Link
                    href='https://create.roblox.com/docs/production/publishing/content-ratings'
                    target='_blank'>
                    {chunks}
                  </Link>
                );
              },
            },
          ])}
        </span>
      </div>

      {showInfoBanner && (
        <FeedbackBanner
          title=''
          description={translate('Description.IARCQuestionnaireOverviewBannerMarch')}
          layout='Inline'
          variant='Emphasis'
          severity='Info'
          primaryActionLabel={translate('Action.ViewDetails')}
          onPrimaryAction={() =>
            window.open(
              'https://create.roblox.com/docs/production/publishing/content-ratings',
              '_blank',
            )
          }
          onDismiss={() => setShowInfoBanner(false)}
        />
      )}

      {hasModerationFeedback && showModerationBanner && (
        <FeedbackBanner
          title=''
          description={
            detailedGuidelines?.submitBy
              ? translate(
                  'Description.ModerationBannerWillBeUnrated' /* in TranslationNamespace.DeveloperQuestionnaire */,
                  {
                    moderationGracePeriodEnd: new Intl.DateTimeFormat(locale ?? undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    }).format(new Date(detailedGuidelines.submitBy)),
                  },
                )
              : translate(
                  'Description.ModerationBannerUnrated' /* in TranslationNamespace.DeveloperQuestionnaire */,
                )
          }
          layout='Inline'
          variant='Emphasis'
          severity='Warning'
          primaryActionLabel={translate(
            'Action.LearnMore' /* in TranslationNamespace.DeveloperQuestionnaire */,
          )}
          onPrimaryAction={() =>
            window.open(
              'https://create.roblox.com/docs/production/publishing/content-ratings',
              '_blank',
            )
          }
          onDismiss={() => setShowModerationBanner(false)}
        />
      )}

      {isMetadataIncomplete && (
        <SystemBanner
          title={translate('Alert.QuestionnaireMetadataIncompleteTitle')}
          description={translate('Alert.QuestionnaireMetadataIncompleteMessage')}
          variant='Standard'
          severity='Warning'
          primaryActionLabel={translate('Action.AddNow')}
          onPrimaryAction={() =>
            window.open(`/dashboard/creations/experiences/${universeId}/configure`, '_blank')
          }
        />
      )}

      <div className='flex gap-small items-center'>
        <Button
          onClick={onStartQuestionnaire}
          size='Medium'
          variant='Emphasis'
          isDisabled={isMetadataIncomplete}
          isLoading={isPublishStatusLoading}>
          {translate(ratingsStatus === 'NotStarted' ? 'Action.GetRating' : 'Action.GetANewRating')}
        </Button>
        {hasModerationFeedback && (
          <Button onClick={() => setIsModerationDialogOpen(true)} size='Medium' variant='Standard'>
            {translate(
              'Action.ReviewModeratorFeedback' /* in TranslationNamespace.DeveloperQuestionnaire */,
            )}
          </Button>
        )}
      </div>

      {hasModerationFeedback && (
        <ModerationFeedbackDialog
          open={isModerationDialogOpen}
          onClose={() => setIsModerationDialogOpen(false)}
          moderation={moderation}
        />
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} size='Large' variant='Contained'>
        <TabsList>
          <TabsTrigger value='ratings'>{translate('Tab.Ratings')}</TabsTrigger>
          <TabsTrigger value='activity'>{translate('Tab.Activity')}</TabsTrigger>
        </TabsList>
        <TabsContent value='ratings'>
          <RatingsContent
            ratingsStatus={ratingsStatus}
            nonCompliantRegionStatus={nonCompliantRegionStatus}
            detailedGuidelines={detailedGuidelines ?? undefined}
          />
        </TabsContent>
        <TabsContent value='activity'>
          <Timeline
            events={activityEvents}
            initialSelectedEvent={deepLinkEvent}
            onSelectedEventChange={handleSelectedEventChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default withTranslation(QuestionnaireOverviewV2, [
  TranslationNamespace.Navigation,
  TranslationNamespace.DeveloperQuestionnaire,
  TranslationNamespace.Error,
]);
