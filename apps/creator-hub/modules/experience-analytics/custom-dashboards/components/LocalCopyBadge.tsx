import type { ReactElement } from 'react';
import { Tooltip, TooltipTrigger } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

function LocalCopyBadge(): ReactElement {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const label = tPendingTranslation(
    'Local',
    'Small badge in a dashboard table row indicating the dashboard is stored only in this browser.',
    translationKey('Badge.CustomDashboards.LocalCopy', TranslationNamespace.Analytics),
  );
  const tooltip = tPendingTranslation(
    'Local dashboards are only visible in this browser',
    'Tooltip on the Local badge explaining that the dashboard is only visible in the current browser.',
    translationKey(
      'Description.CustomDashboards.LocalBadgeTooltip',
      TranslationNamespace.Analytics,
    ),
  );

  return (
    <Tooltip title={tooltip} position='top-center'>
      <TooltipTrigger asChild>
        <span
          className='shrink-0 radius-small bg-surface-200 padding-x-xsmall padding-y-xxsmall text-caption-small content-muted cursor-help'
          aria-label={tooltip}>
          {label}
        </span>
      </TooltipTrigger>
    </Tooltip>
  );
}

export default LocalCopyBadge;
