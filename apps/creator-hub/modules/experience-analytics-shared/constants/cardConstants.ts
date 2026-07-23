import { TGridProps, TTypographyProps } from '@rbx/ui';

export type TCardStyleConfig = {
  maxWidth: number;
  minWidth: number;
  padding: number;
  loadingBodyHeight: number;
  loadingBodyWidth: number;
  contentDirection: TGridProps['direction'];
  titleTypographyVariant: TTypographyProps['variant'];
};

export type THeroItemCardStyleConfig = {
  valueTypographyVariant: TTypographyProps['variant'];
} & TCardStyleConfig;

const largeHeroItemCardStyle: THeroItemCardStyleConfig = {
  maxWidth: 500,
  minWidth: 300,
  padding: 24,
  loadingBodyHeight: 105,
  loadingBodyWidth: 260,
  contentDirection: 'row',
  titleTypographyVariant: 'h5',
  valueTypographyVariant: 'h3',
};

const smallHeroItemCardStyle: THeroItemCardStyleConfig = {
  maxWidth: 224,
  minWidth: 150,
  padding: 16,
  loadingBodyHeight: 190,
  loadingBodyWidth: 125,
  contentDirection: 'column',
  titleTypographyVariant: 'body1',
  valueTypographyVariant: 'h5',
};

export const HeroItemCardStyles = {
  large: largeHeroItemCardStyle,
  small: smallHeroItemCardStyle,
};
