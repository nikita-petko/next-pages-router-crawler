import React, { useMemo } from 'react';
import { Alert, AlertTitle, Button, Link, makeStyles, Typography } from '@rbx/ui';
import { translationKey, useTranslationWrapper } from '@modules/analytics-translations';
import { useTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { EmptyState } from '@modules/miscellaneous/common/components';
import { urls } from '@modules/miscellaneous/common';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import { useFeatureFlagsForNamespace } from '@modules/feature-flags/context/FeatureFlagsProvider';
import ToExperimentCreateOrEditPageButton from './ToExperimentCreateOrEditPageButton';

const useStyles = makeStyles()(() => ({
  alertRoot: {
    marginBottom: '24px',
  },
}));

const makeTakeActionLinkUnderlined = (chunks: React.ReactNode, href?: string) => {
  return (
    <Link
      href={href ?? urls.creatorHub.docs.getExperimentationUrl()}
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
  const { experienceHasPerformanceMonitoringAccess: hasAtLeast100DAU } =
    useFeatureFlagsForNamespace(
      'experienceHasPerformanceMonitoringAccess',
      FeatureFlagNamespace.Analytics,
    );
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
            href={urls.creatorHub.docs.getExperimentationBestPracticesUrl()}
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
                    urls.creatorHub.docs.getExperimentationBestPracticesUrl(),
                  ),
              },
            ],
          )}
        </Typography>
      </Alert>
    );
  }, [alertRoot, hasAtLeast100DAU, translate, translateHTML]);

  return (
    <React.Fragment>
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
    </React.Fragment>
  );
};

export default EmptyExperimentsCard;
