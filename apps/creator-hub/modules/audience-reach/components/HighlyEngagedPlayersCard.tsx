import { useMemo, type FC } from 'react';
import { ReasonEnum, SelectStatusEnum } from '@rbx/client-core-content-api/v1';
import { getProductionCreatorHubUrl } from '@rbx/env-utils';
import { Alert, IconButton, Tooltip, TooltipTrigger } from '@rbx/foundation-ui';
import { useLocalization, useTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { Ages16PlusThreshold } from '../constants/audienceReachConstants';
import type { ThresholdBarColor } from '../types/audienceReach';
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
  thresholdTrigger: number;
  thresholdReset: number;
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
  thresholdTrigger,
  thresholdReset,
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

  return (
    <div className='flex flex-col gap-medium padding-large radius-medium stroke-standard stroke-emphasis'>
      {showAtRiskCallout ? (
        <Alert
          variant='Feedback'
          severity='Warning'
          hasCloseAffordance={false}
          primaryActionLabel={translateWithNamespace(
            TranslationNamespace.AudienceReach,
            'Action.IncreaseEngagement',
          )}
          onPrimaryAction={() => {
            window.open(KIDS_AND_SELECT_DOCS_URL, '_blank', 'noopener,noreferrer');
          }}>
          <div className='flex flex-col min-width-0 gap-xsmall'>
            <span className='text-label-medium'>
              {translateWithNamespace(
                TranslationNamespace.AudienceReach,
                'Heading.ThresholdAtRisk',
              )}
            </span>
            <span>
              {translateWithNamespace(
                TranslationNamespace.AudienceReach,
                'Description.ThresholdAtRisk',
                {
                  targetUsers: String(thresholdReset),
                  deadline: thresholdDeadline,
                },
              )}
            </span>
          </div>
        </Alert>
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
      <ContentThresholdBar score={score} thresholdTrigger={thresholdTrigger} barColor={barColor} />
      {lastUpdated && (
        <div className='flex items-center gap-xsmall text-body-medium content-muted'>
          {translateWithNamespace(TranslationNamespace.AudienceReach, 'Label.LastUpdated', {
            date: lastUpdated.toLocaleDateString(locale ?? 'en-us', {
              timeZone: 'UTC',
            }),
          })}
          <Tooltip
            position='bottom-center'
            title={translateWithNamespace(
              TranslationNamespace.AudienceReach,
              'Label.HepGraphUpdateFrequency',
            )}>
            <TooltipTrigger asChild>
              <IconButton
                icon='icon-regular-circle-i'
                variant='Utility'
                size='XSmall'
                isCircular
                ariaLabel={translateWithNamespace(
                  TranslationNamespace.AudienceReach,
                  'Label.HepGraphUpdateFrequency',
                )}
              />
            </TooltipTrigger>
          </Tooltip>
        </div>
      )}
    </div>
  );
};

export default HighlyEngagedPlayersCard;
