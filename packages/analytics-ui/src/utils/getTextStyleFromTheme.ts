import type { TTheme, TTypographyProps } from '@rbx/ui';

type TTypographyVariants = Required<Pick<TTypographyProps, 'variant'>>['variant'];

export const getTextStyleFromTheme = (
  theme: TTheme,
  variant: TTypographyVariants,
): Record<string, string | number | undefined> => {
  return {
    fontFamily: theme.typography[variant].fontFamily,
    fontWeight: theme.typography[variant].fontWeight,
    fontStyle: theme.typography[variant].fontStyle,
    lineHeight: theme.typography[variant].lineHeight,
    letterSpacing: theme.typography[variant].letterSpacing,
    fontSize: theme.typography[variant].fontSize,
  };
};

export const getTextStyleWithoutWeightFromThemeInHTML = (
  theme: TTheme,
  variant: TTypographyVariants,
) => {
  return `font-family: ${theme.typography[variant].fontFamily}; font-style: ${theme.typography[variant].fontStyle}; line-height: ${theme.typography[variant].lineHeight}; letter-spacing: ${theme.typography[variant].letterSpacing}; font-size: ${theme.typography[variant].fontSize};`;
};

export const getTextStyleFromThemeInHTML = (theme: TTheme, variant: TTypographyVariants) => {
  return `font-family: ${theme.typography[variant].fontFamily}; font-weight: ${theme.typography[variant].fontWeight}; font-style: ${theme.typography[variant].fontStyle}; line-height: ${theme.typography[variant].lineHeight}; letter-spacing: ${theme.typography[variant].letterSpacing}; font-size: ${theme.typography[variant].fontSize};`;
};
