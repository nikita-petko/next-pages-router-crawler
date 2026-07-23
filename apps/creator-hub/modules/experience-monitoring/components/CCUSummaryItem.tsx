import type { FunctionComponent, ReactNode } from 'react';
import { useMemo } from 'react';
import { numberFormatter } from '@rbx/core';
import { Grid, InfoOutlinedIcon, Tooltip, Typography } from '@rbx/ui';
import type {
  FormattedText,
  TranslationKey,
  TranslationKeyAndTagsToFormattedReactNode,
  TranslationKeyToFormattedText,
} from '@modules/analytics-translations/types';
import {
  translationKey,
  translationKeyWithoutNamespace,
} from '@modules/analytics-translations/wrapperFunctions';
import { DevicesType } from '@modules/clients/develop';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useCCUSummaryStyles from './CCUSummary.styles';

enum TotalCCU {
  Total = 'Total',
}

type CCUSummaryType = DevicesType | TotalCCU;
export const CCUSummaryType = { ...DevicesType, ...TotalCCU };

export type CCUSummaryItemSpec = {
  type: CCUSummaryType;
  value: number;
  tooltipKey?: TranslationKey;
  totalServerCount?: number;
  isLarge?: boolean;
};

const getConcurrentUsersLabelKey = (serverCount: number): TranslationKey => {
  if (serverCount === 1) {
    return translationKey('Label.ConcurrentUsersInServer', TranslationNamespace.Analytics);
  }
  if (serverCount > 1) {
    return translationKey('Label.ConcurrentUsersInServers', TranslationNamespace.Analytics);
  }
  return translationKey('Label.ConcurrentUsers', TranslationNamespace.Analytics);
};

const getLabelKey = (type: CCUSummaryType, serverCount?: number): TranslationKey | null => {
  switch (type) {
    case CCUSummaryType.Total:
      return getConcurrentUsersLabelKey(serverCount ?? 0);
    case CCUSummaryType.Computer:
      return translationKey('Label.Computer', TranslationNamespace.Analytics);
    case CCUSummaryType.Console:
      return translationKey('Label.Console', TranslationNamespace.Analytics);
    case CCUSummaryType.Phone:
      return translationKey('Label.Phone', TranslationNamespace.Analytics);
    case CCUSummaryType.Tablet:
      return translationKey('Label.Tablet', TranslationNamespace.Analytics);
    case CCUSummaryType.Vr:
      return translationKey('Label.VR', TranslationNamespace.Analytics);
    case CCUSummaryType.Tv:
      return translationKey('Label.TV', TranslationNamespace.Analytics);
    default: {
      return null;
    }
  }
};

const getLabel = (
  type: CCUSummaryType,
  translate: TranslationKeyToFormattedText,
  translateHTML?: TranslationKeyAndTagsToFormattedReactNode,
  serverCountLabel?: string,
  serverCount?: number,
): FormattedText | ReactNode => {
  const labelKey = getLabelKey(type, serverCount);

  if (labelKey == null) {
    return null;
  }

  if (type === CCUSummaryType.Total && serverCount && translateHTML) {
    return translateHTML(labelKey, [], {
      servers: (
        <span className={serverCountLabel ?? ''}>{numberFormatter(Math.round(serverCount))}</span>
      ),
    });
  }
  return translate(labelKey) || translate(translationKeyWithoutNamespace('Label.Unknown'));
};

const CCUSummaryItem: FunctionComponent<CCUSummaryItemSpec> = ({
  tooltipKey,
  totalServerCount,
  isLarge,
  value,
  type,
}) => {
  const { translate, translateHTML } = useRAQIV2TranslationDependencies();

  const {
    classes: {
      summaryItemContainer,
      tooltipIconPadding,
      numberFont,
      totalNumberFont,
      numberContainer,
      serverCountLabel,
    },
  } = useCCUSummaryStyles({
    large: isLarge ?? false,
  });

  const { formattedValue, label, tooltip } = useMemo(() => {
    return {
      formattedValue: numberFormatter(Math.round(value)),
      label: getLabel(type, translate, translateHTML, serverCountLabel, totalServerCount),
      tooltip: tooltipKey ? translate(tooltipKey) : null,
    };
  }, [value, type, translate, translateHTML, serverCountLabel, totalServerCount, tooltipKey]);

  return (
    <Grid item>
      <Grid
        container
        direction='column'
        className={summaryItemContainer}
        justifyContent='space-between'>
        <Grid item>
          <Typography align='left' variant={isLarge ? 'body1' : 'body2'}>
            {label}
            &nbsp;
            {tooltip && (
              <Tooltip title={tooltip} placement='top' enterTouchDelay={0} leaveTouchDelay={3000}>
                <div className={tooltipIconPadding}>
                  <InfoOutlinedIcon fontSize='small' />
                </div>
              </Tooltip>
            )}
          </Typography>
        </Grid>
        <Grid item className={numberContainer}>
          <Typography
            align='left'
            className={type === CCUSummaryType.Total ? totalNumberFont : numberFont}>
            {formattedValue}
          </Typography>
        </Grid>
      </Grid>
    </Grid>
  );
};
export default CCUSummaryItem;
