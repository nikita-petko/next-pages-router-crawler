import type { FC } from 'react';
import { useMemo } from 'react';
import { resolveUrl } from '@rbx/env-utils';
import { withTranslation } from '@rbx/intl';
import { Link, Typography, makeStyles } from '@rbx/ui';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { AnalyticsDocLink } from '@modules/charts-generic/types/AnalyticsDocLink';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

const assistantDocLink: AnalyticsDocLink = '/docs/production/analytics/insights#analytics-reports';

const useAssistantDisclaimerStyles = makeStyles()((theme) => ({
  disclaimer: {
    padding: theme.spacing(1, 1, 0),
    textAlign: 'center' as const,
    width: '100%',
  },
}));

const AssistantDisclaimer: FC = () => {
  const {
    classes: { disclaimer },
  } = useAssistantDisclaimerStyles();
  const { translateHTML } = useRAQIV2TranslationDependencies();

  const content = useMemo(
    () =>
      translateHTML(
        translationKey('Label.Assistant.Disclaimer', TranslationNamespace.AnalyticsAssistant),
        [
          {
            opening: 'learnMoreLinkStart',
            closing: 'learnMoreLinkEnd',
            content(chunks) {
              return (
                <Link href={assistantDocLink} target='_blank' underline='always' color='inherit'>
                  {chunks}
                </Link>
              );
            },
          },
          {
            opening: 'termsLinkStart',
            closing: 'termsLinkEnd',
            content(chunks) {
              return (
                <Link
                  href={resolveUrl(
                    'aiBasedToolsSupplementalTermsAndDisclaimer',
                    process.env.targetEnvironment,
                    process.env.buildTarget,
                  )}
                  target='_blank'
                  underline='always'
                  color='inherit'>
                  {chunks}
                </Link>
              );
            },
          },
        ],
      ),
    [translateHTML],
  );

  return (
    <div className={disclaimer}>
      <Typography variant='caption' color='secondary'>
        {content}
      </Typography>
    </div>
  );
};

export default withTranslation(AssistantDisclaimer, [TranslationNamespace.AnalyticsAssistant]);
