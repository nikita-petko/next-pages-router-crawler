import type { FC } from 'react';
import React, { useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import { Container, Grid, Skeleton, Typography } from '@rbx/ui';
import type { FormattedText } from '@modules/analytics-translations/types';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { ComparisonChipSpec } from '../charts/ComparisonChip';
import ComparisonChip from '../charts/ComparisonChip';
import type { GenericChartState } from '../charts/types/ChartTypes';

type SummaryItemProps = {
  label: FormattedText;
  value: FormattedText;
  variant?: 'default' | 'compact';
  comparisonChipSpec?: ComparisonChipSpec;
  comparisonChipRef?: React.RefObject<HTMLDivElement | null>;
} & GenericChartState;

const SummaryItem: FC<SummaryItemProps> = ({
  label,
  value,
  variant,
  comparisonChipSpec,
  isDataLoading,
  isResponseFailed,
  isUserForbidden,
  comparisonChipRef,
}) => {
  const { translate } = useTranslationWrapper(useTranslation());

  const labelRow = useMemo(() => {
    return label ? (
      <Typography variant={variant === 'compact' ? 'smallLabel2' : 'body2'} color='secondary'>
        {label}
      </Typography>
    ) : undefined;
  }, [label, variant]);

  const statsRow = useMemo(() => {
    let stats: React.ReactNode = value;
    if (isDataLoading) {
      stats = <Skeleton width={60} animate />;
    } else if (isUserForbidden) {
      stats = translate(
        translationKey('Message.UserHasNoPermission', TranslationNamespace.Analytics),
      );
    } else if (isResponseFailed) {
      stats = translate(translationKey('Message.RequestFailure', TranslationNamespace.Analytics));
    }

    const valueTypographyVariant = variant === 'compact' ? 'h5' : 'h2';
    return (
      <Grid container justifyContent='space-between' alignItems='center'>
        <Grid item minHeight='32px' alignItems='center' display='flex'>
          <Typography variant={isResponseFailed ? 'body1' : valueTypographyVariant}>
            {stats}
          </Typography>
        </Grid>
        {comparisonChipSpec && (
          <Grid item>
            <Typography variant='largeLabel1' ref={comparisonChipRef}>
              <ComparisonChip {...comparisonChipSpec} />
            </Typography>
          </Grid>
        )}
      </Grid>
    );
  }, [
    comparisonChipRef,
    comparisonChipSpec,
    isDataLoading,
    isResponseFailed,
    isUserForbidden,
    translate,
    value,
    variant,
  ]);

  return (
    <Container disableGutters maxWidth={false}>
      {labelRow}
      {statsRow}
    </Container>
  );
};

export default SummaryItem;
