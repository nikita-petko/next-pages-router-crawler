import type { FunctionComponent } from 'react';
import { ChartColor } from '@rbx/analytics-ui';
import { useTranslation } from '@rbx/intl';
import type { ThumbnailTypes } from '@rbx/thumbnails';
import { ReturnPolicy, Thumbnail2d } from '@rbx/thumbnails';
import { Avatar, Typography } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { formatRoyaltyRate } from '@modules/licenses/utils/format';
import Flex from '@modules/miscellaneous/components/Flex';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

const LEGEND_SWATCH_CLASS_NAME = 'width-100 height-full shrink-0 radius-xsmall';

const LegendSwatchClassNameByChartColor: Record<ChartColor, string> = {
  [ChartColor.Blue]: `${LEGEND_SWATCH_CLASS_NAME} bg-action-emphasis`,
  [ChartColor.Green]: `${LEGEND_SWATCH_CLASS_NAME} bg-system-success`,
  [ChartColor.Purple]: `${LEGEND_SWATCH_CLASS_NAME} bg-action-sub-emphasis`,
  [ChartColor.Yellow]: `${LEGEND_SWATCH_CLASS_NAME} bg-system-warning`,
  [ChartColor.Cyan]: `${LEGEND_SWATCH_CLASS_NAME} bg-action-link`,
  [ChartColor.Red]: `${LEGEND_SWATCH_CLASS_NAME} bg-system-alert`,
  [ChartColor.Purple2]: `${LEGEND_SWATCH_CLASS_NAME} bg-action-sub-emphasis`,
  [ChartColor.Orange]: `${LEGEND_SWATCH_CLASS_NAME} bg-system-warning`,
  [ChartColor.Blue2]: `${LEGEND_SWATCH_CLASS_NAME} bg-action-emphasis`,
  [ChartColor.Green2]: `${LEGEND_SWATCH_CLASS_NAME} bg-system-success`,
  [ChartColor.Purple3]: `${LEGEND_SWATCH_CLASS_NAME} bg-action-sub-emphasis`,
  [ChartColor.Yellow2]: `${LEGEND_SWATCH_CLASS_NAME} bg-system-warning`,
  [ChartColor.Yellow3]: `${LEGEND_SWATCH_CLASS_NAME} bg-system-warning`,
  [ChartColor.Green3]: `${LEGEND_SWATCH_CLASS_NAME} bg-system-success`,
  [ChartColor.Cyan2]: `${LEGEND_SWATCH_CLASS_NAME} bg-action-link`,
  [ChartColor.Blue3]: `${LEGEND_SWATCH_CLASS_NAME} bg-action-emphasis`,
  [ChartColor.Purple4]: `${LEGEND_SWATCH_CLASS_NAME} bg-action-sub-emphasis`,
  [ChartColor.White]: `${LEGEND_SWATCH_CLASS_NAME} bg-surface-0`,
};

interface RevSplitRowProps {
  /** Slice color, matching the pie chart `ChartColor`. */
  color: ChartColor;
  /** The asset ID of the thumbnail */
  assetId: number;
  /** The type of asset thumbnail to fetch */
  assetThumbnailType: ThumbnailTypes;
  /** The label to use to identify the split on the chart */
  splitName: string;
  /** The percentage of the split (0-100) */
  percentage: number;
}

/** A row in the the revenue split chart's legend */
const RevSplitRow: FunctionComponent<RevSplitRowProps> = ({
  color,
  assetId,
  assetThumbnailType,
  splitName,
  percentage,
}) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const avatarAlt = tPendingTranslation(
    'avatar',
    'Alternative text for an avatar in the revenue-share chart legend.',
    translationKey('Label.RevenueShareAvatar', TranslationNamespace.AgreementsManager),
  );
  const thumbnailAlt = tPendingTranslation(
    'thumbnail',
    'Alternative text for a thumbnail in the revenue-share chart legend.',
    translationKey('Label.RevenueShareThumbnail', TranslationNamespace.AgreementsManager),
  );

  return (
    <Flex justifyContent='space-between'>
      <Flex gap={8} alignItems='center'>
        <div className={LegendSwatchClassNameByChartColor[color]} aria-hidden />
        <Avatar variant='rounded' alt={avatarAlt}>
          <Thumbnail2d
            targetId={assetId}
            type={assetThumbnailType}
            alt={thumbnailAlt}
            returnPolicy={ReturnPolicy.PlaceHolder}
            includeBackground={false}
          />
        </Avatar>
        <Typography variant='body1'>{splitName}</Typography>
      </Flex>

      <Flex alignItems='center'>
        <Typography variant='h6' component='span'>
          {formatRoyaltyRate(percentage)}
        </Typography>
      </Flex>
    </Flex>
  );
};

export default RevSplitRow;
