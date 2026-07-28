import React, { useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import { Alert, AlertTitle, Button, Link, makeStyles, Typography } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { useAnalyticsExperiencePermissions } from '@modules/experience-analytics-shared/hooks/useAnalyticsPermissions';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import EmptyState from '@modules/miscellaneous/components/EmptyState/EmptyState';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { creatorHub } from '@modules/miscellaneous/urls';
import ToExperimentCreateOrEditPageButton from './ToExperimentCreateOrEditPageButton';

const useStyles = makeStyles()(() => ({
  alertRoot: {
    marginBottom: '24px',
  },
}));

const makeTakeActionLinkUnderlined = (chunks: React.ReactNode, href?: string) => {
  return (
    <Link
      href={href ?? creatorHub.docs.getExperimentationUrl()}
      target='_blank'
      underline='always'
      color='inherit'>
      {chunks}
    </Link>
  );
};

const EmptyExperimentsCard = () => {
  const { translate, translateHTML } = useTranslationWrapper(useTranslation());
  const {
    classes: { alertRoot },
  } = useStyles();
  const { id: universeId } = useUniverseResource();
  const { experienceHasPerformanceMonitoringAccess: hasAtLeast100DAU } =
    useAnalyticsExperiencePermissions(universeId);
  const alert = useMemo(() => {
    if (hasAtLeast100DAU) {
      return null;
    }

    return (
      <Alert
        variant='outlined'
        severity='warning'
        classes={{ root: alertRoot }}
        action={
          <Link
            href={creatorHub.docs.getExperimentationBestPracticesUrl()}
            target='_blank'
            color='inherit'>
            <Button variant='contained' color='secondary'>
              {translate(
                translationKey(
                  'Label.ViewBestPractices',
                  TranslationNamespace.UniverseConfigAndExperimentation,
                ),
              )}
            </Button>
          </Link>
        }>
        <AlertTitle>
          {translate(
            translationKey(
              'Title.EmptyExperimentsDAUAlert',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          )}
        </AlertTitle>
        <Typography component='div' marginTop='6px' variant='smallLabel1'>
          {translateHTML(
            translationKey(
              'Description.EmptyExperimentsDAUAlert',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
            [
              {
                opening: 'linkStart',
                closing: 'linkEnd',
                content: (chunks) =>
                  makeTakeActionLinkUnderlined(
                    chunks,
                    creatorHub.docs.getExperimentationBestPracticesUrl(),
                  ),
              },
            ],
          )}
        </Typography>
      </Alert>
    );
  }, [alertRoot, hasAtLeast100DAU, translate, translateHTML]);

  return (
    <>
      {alert}
      <EmptyState
        title={translate(
          translationKey(
            'Title.EmptyExperiments',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        )}
        description={translateHTML(
          translationKey(
            'Description.EmptyExperiments',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
          [
            {
              opening: 'linkStart',
              closing: 'linkEnd',
              content: makeTakeActionLinkUnderlined,
            },
          ],
        )}
        size='large'
        illustration='barGraph'>
        <ToExperimentCreateOrEditPageButton
          label={translate(
            translationKey(
              'Label.CreateExperiment',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          )}
        />
      </EmptyState>
    </>
  );
};

export default EmptyExperimentsCard;
