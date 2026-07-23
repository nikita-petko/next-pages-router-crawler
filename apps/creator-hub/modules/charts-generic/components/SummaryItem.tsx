import React, { FC, useMemo } from 'react';
import { Container, Grid, Skeleton, Typography } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  FormattedText,
  useTranslationWrapper,
  translationKey,
} from '@modules/analytics-translations';
import ComparisonChip, { ComparisonChipSpec } from '../charts/ComparisonChip';
import { GenericChartState } from '../charts/types/ChartTypes';

type SummaryItemProps = {
  label: FormattedText;
  value: FormattedText;
  comparisonChipSpec?: ComparisonChipSpec;
  comparisonChipRef?: React.RefObject<HTMLDivElement | null>;
} & GenericChartState;

const SummaryItem: FC<SummaryItemProps> = ({
  label,
  value,
  comparisonChipSpec,
  isDataLoading,
  isResponseFailed,
  isUserForbidden,
  comparisonChipRef,
}) => {
  const { translate } = useTranslationWrapper(useTranslation());

  const labelRow = useMemo(() => {
    return label ? (
      <Typography variant='body2' color='secondary'>
        {label}
      </Typography>
    ) : undefined;
  }, [label]);

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

    return (
      <Grid container justifyContent='space-between' alignItems='center'>
        <Grid item minHeight='32px' alignItems='center' display='flex'>
          <Typography variant={isResponseFailed ? 'body1' : 'h2'}>{stats}</Typography>
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
  ]);

  return (
    <Container disableGutters maxWidth={false}>
      {labelRow}
      {statsRow}
    </Container>
  );
};

export default SummaryItem;
