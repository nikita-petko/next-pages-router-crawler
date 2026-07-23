import React from 'react';
import { ComparisonChipSpec, GenericChartState } from '@modules/charts-generic';
import { FormattedText } from '@modules/analytics-translations';
import {
  AnalyticsHeroItemCard,
  AnalyticsHeroItemCategory,
  THeroItemCardStyleConfig,
} from '@modules/experience-analytics-shared';
import { AvatarItemType, AvatarItemTypeToTargetType } from '@modules/clients/analytics';
import AvatarItemTargetTypeToItemType from '../utils/AvatarItemTargetTypeToItemType';

export type AvatarItemCardSpec = {
  targetId: number;
  itemType: AvatarItemType;
  avatarItemName: string;
  value: number | null;
  topCategory: AnalyticsHeroItemCategory;
  styleConfig: THeroItemCardStyleConfig;
  comparisonChipSpec?: ComparisonChipSpec;
} & GenericChartState;

const AvatarItemCard = ({
  targetId,
  itemType,
  avatarItemName,
  value,
  topCategory,
  styleConfig,
  comparisonChipSpec,
  isDataLoading,
  isResponseFailed,
  isUserForbidden,
}: AvatarItemCardSpec) => {
  const targetType = AvatarItemTypeToTargetType[itemType];
  const itemCardType = AvatarItemTargetTypeToItemType[targetType];

  return (
    <AnalyticsHeroItemCard
      targetId={targetId}
      itemType={itemCardType}
      itemName={avatarItemName as FormattedText}
      value={value}
      topCategory={topCategory}
      styleConfig={styleConfig}
      comparisonChipSpec={comparisonChipSpec}
      isDataLoading={isDataLoading}
      isResponseFailed={isResponseFailed}
      isUserForbidden={isUserForbidden}
    />
  );
};

export default AvatarItemCard;
