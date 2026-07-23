import { useMemo, type FC } from 'react';
import { ReasonEnum, SelectStatusEnum } from '@rbx/client-core-content-api/v1';
import { getProductionCreatorHubUrl } from '@rbx/env-utils';
import { FeedbackBanner } from '@rbx/foundation-ui';
import { useLocalization, useTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { Ages16PlusThreshold, ContentThresholdValue } from '../constants/audienceReachConstants';
import type { ThresholdBarColor } from '../types/audienceReach';
import type { CardMessage } from './AudienceReachCard';
import ContentThresholdBar from './ContentThresholdBar';

interface HighlyEngagedPlayersCardProps {
  selectStatus: SelectStatusEnum;
  selectReasons: ReasonEnum[];
  contentMinimumAge: number;
  isPrivate: boolean;
  isUnrated: boolean;
  isExempt: boolean;
  score: number;
  lastUpdated: Date | null;
  barColor: ThresholdBarColor;
  daysRemaining: number;
}

const KIDS_AND_SELECT_DOCS_URL = `${getProductionCreatorHubUrl(
  process.env.buildTarget,
)}/docs/production/publishing/kids-and-select#publishing-requirements`;

const HighlyEngagedPlayersCard: FC<HighlyEngagedPlayersCardProps> = ({
  selectStatus,
  selectReasons,
  contentMinimumAge,
  isPrivate,
  isUnrated,
  isExempt,
  score,
  lastUpdated,
  barColor,
  daysRemaining,
}) => {
  const { locale } = useLocalization();
  const { translateWithNamespace } = useTranslation();

  const isPublic = !isPrivate;
  const isUnderSixteen = contentMinimumAge < Ages16PlusThreshold;
  const isSelectEligible = selectStatus === SelectStatusEnum.Eligible;
  const isNotApplicable =
    selectStatus === SelectStatusEnum.NotApplicable || isUnrated || isPrivate || !isUnderSixteen;
  const hasThresholdReason = selectReasons.includes(ReasonEnum.Threshold);

  // The at-risk callout is the grace-period signal: the API still reports the
  // experience as select-eligible but has flagged Threshold, meaning they're
  // on borrowed time before tier drops. Once `selectStatus` flips to
  // NotEligible the grace period is over and the callout no longer applies.
  const showAtRiskCallout =
    isPublic && isUnderSixteen && isSelectEligible && hasThresholdReason && !isExempt;

  const date = new Date();
  date.setDate(date.getDate() + daysRemaining);
  const thresholdDeadline = date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const valueLabel = useMemo(() => {
    if (isExempt) {
      return translateWithNamespace(TranslationNamespace.AudienceReach, 'Label.Exempt');
    }
    if (isNotApplicable) {
      return translateWithNamespace(TranslationNamespace.AudienceReach, 'Label.NotApplicable');
    }
    if (hasThresholdReason) {
      return translateWithNamespace(TranslationNamespace.AudienceReach, 'Label.NotEligible');
    }
    return translateWithNamespace(TranslationNamespace.AudienceReach, 'Label.Eligible');
  }, [translateWithNamespace, hasThresholdReason, isExempt, isNotApplicable]);

  const message: CardMessage | undefined = showAtRiskCallout
    ? {
        severity: 'Warning',
        layout: 'Stacked',
        title: translateWithNamespace(
          TranslationNamespace.AudienceReach,
          'Heading.ThresholdAtRisk',
        ),
        description: translateWithNamespace(
          TranslationNamespace.AudienceReach,
          'Description.ThresholdAtRisk',
          {
            targetUsers: String(ContentThresholdValue),
            deadline: thresholdDeadline,
          },
        ),
        action: {
          label: translateWithNamespace(
            TranslationNamespace.AudienceReach,
            'Action.IncreaseEngagement',
          ),
          onClick: () => {
            window.open(KIDS_AND_SELECT_DOCS_URL, '_blank', 'noopener,noreferrer');
          },
        },
      }
    : undefined;

  return (
    <div className='flex flex-col gap-medium padding-large radius-medium stroke-standard stroke-emphasis'>
      {message ? (
        <FeedbackBanner
          title={message.title}
          description={message.description}
          primaryActionLabel={message.action?.label}
          onPrimaryAction={message.action?.onClick}
          layout={message.layout ?? 'Inline'}
          variant='Emphasis'
          severity={message.severity}
        />
      ) : null}
      <div className='flex items-center wrap gap-medium'>
        <div className='flex flex-col gap-xsmall grow-1 shrink-1'>
          <span className='text-body-medium content-muted'>
            {translateWithNamespace(
              TranslationNamespace.AudienceReach,
              'Label.HighlyEngagedPlayers',
            )}
          </span>
          <div className='flex items-center gap-small'>
            <span className='text-title-large'>{valueLabel}</span>
          </div>
        </div>
      </div>
      <div className='text-body-medium content-muted'>
        {translateWithNamespace(TranslationNamespace.AudienceReach, 'Description.ContentThreshold')}
      </div>
      <ContentThresholdBar score={score} barColor={barColor} />
      {lastUpdated && (
        <div className='text-body-medium content-muted'>
          {translateWithNamespace(TranslationNamespace.AudienceReach, 'Label.LastUpdated', {
            date: lastUpdated.toLocaleDateString(locale ?? 'en-us', {
              timeZone: 'UTC',
            }),
          })}
        </div>
      )}
    </div>
  );
};

export default HighlyEngagedPlayersCard;
