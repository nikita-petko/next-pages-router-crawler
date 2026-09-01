import { useEffect } from 'react';
import Link from 'next/link';
import { AgreementCandidateType } from '@rbx/client-content-licensing-api/v1';
import { useFlag } from '@rbx/flags';
import { useTranslation } from '@rbx/intl';
import { Button, Tooltip } from '@rbx/ui';
import { isAvatarItemLicensingEnabled as isAvatarItemLicensingEnabledFlag } from '@generated/flags/contentLicensing';
import EmptyState from '@modules/miscellaneous/components/EmptyState/EmptyState';
import EmptyStateBorder from '@modules/miscellaneous/components/EmptyState/EmptyStateBorder';
import { IP_FAMILIES_HREF } from '../../../ipFamilies/urls';
import {
  LicenseManagerClickEvent,
  LicenseManagerImpressionEvent,
  useLicenseManagerLogger,
  useLicenseManagerLoggerLogOnce,
} from '../../utils/logger';

type NoMatchesContentProps =
  | {
      candidateType: typeof AgreementCandidateType.Universe;
      openDialog?: () => void;
      maxLimit: number;
    }
  | {
      candidateType: typeof AgreementCandidateType.Collectible;
    };

const NoMatchesContent = (props: NoMatchesContentProps) => {
  const { translate } = useTranslation();
  const { logEvent } = useLicenseManagerLogger();
  const { logOnce } = useLicenseManagerLoggerLogOnce();
  const { ready: isAvatarItemLicensingFlagReady, value: isAvatarItemLicensingEnabled } = useFlag(
    isAvatarItemLicensingEnabledFlag,
  );
  const isExperienceContent = props.candidateType === AgreementCandidateType.Universe;
  const shouldShowCollectibleContent =
    isAvatarItemLicensingFlagReady && isAvatarItemLicensingEnabled;

  useEffect(() => {
    if (isExperienceContent || !shouldShowCollectibleContent) {
      return;
    }

    logOnce(LicenseManagerImpressionEvent.EmptyStateMatchesTableNoMatchesImpressionEvent, {
      candidateType: props.candidateType,
    });
  }, [isExperienceContent, logOnce, props.candidateType, shouldShowCollectibleContent]);

  if (!isExperienceContent && !shouldShowCollectibleContent) {
    return null;
  }

  return (
    <EmptyStateBorder>
      <EmptyState
        title={translate('Heading.NoMatchResultsYet')}
        size='small'
        description={translate(
          isExperienceContent ? 'Description.NoMatches' : 'Description.NoMatchesFound',
        )}
        illustration={isExperienceContent ? 'experiences' : 'avatarItem'}>
        <div className='flex gap-small'>
          <Button
            component={Link}
            href={IP_FAMILIES_HREF}
            color='primaryBrand'
            variant='contained'
            onClick={() => {
              logEvent(LicenseManagerClickEvent.MatchesTableUpdateIpLibraryClickEvent, {
                candidateType: props.candidateType,
              });
            }}>
            {translate('Action.UpdateIpLibrary')}
          </Button>
          {isExperienceContent && (
            <Tooltip
              title={translate('Label.DailyLimitReached', {
                maxLimit: props.maxLimit.toString(),
              })}
              arrow
              placement='bottom'
              disableHoverListener={!!props.openDialog}
              disableFocusListener={!!props.openDialog}
              disableTouchListener={!!props.openDialog}>
              <div>
                <Button
                  size='medium'
                  variant='contained'
                  color='secondary'
                  onClick={props.openDialog}
                  disabled={!props.openDialog}>
                  {translate('Action.RequestMatch')}
                </Button>
              </div>
            </Tooltip>
          )}
        </div>
      </EmptyState>
    </EmptyStateBorder>
  );
};

export default NoMatchesContent;
