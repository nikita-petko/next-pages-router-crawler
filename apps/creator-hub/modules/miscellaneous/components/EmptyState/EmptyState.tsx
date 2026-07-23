import React from 'react';
import { Typography, makeStyles } from '@rbx/ui';
import Flex from '../Flex';
import ThemedImage from '../ThemedImage';
import emptyStateIllustrations from './emptyStateIllustrations';
import legacySpotIllustrations from './legacyAssetConstants';

const useStyles = makeStyles()(() => ({
  smallContainer: {
    margin: '48px 0',
    padding: '0 24px',
    width: '100%',
  },
  largeContainer: {
    margin: '100px 0',
    width: '100%',
  },
  smallText: {
    gap: 6,
    maxWidth: 510,
    marginBottom: 16,
  },
  largeText: {
    gap: 6,
    maxWidth: 480,
    marginBottom: 24,
  },
}));

type TEmptyStateIllustration = keyof typeof emptyStateIllustrations;
type TLegacyIllustrationKey<T extends 'small' | 'large'> =
  keyof (typeof legacySpotIllustrations)[T];
type TLegacyEmptyStateIllustration =
  | TLegacyIllustrationKey<'small'>
  | TLegacyIllustrationKey<'large'>;
export type EmptyStateIllustrationKey = TEmptyStateIllustration | TLegacyEmptyStateIllustration;

export type TEmptyState = {
  title: string;
  description?: React.ReactNode;
  // legacy size prop used only for legacy illustrations, only for backwards compatibility
  size?: 'small' | 'large';
  illustration?: EmptyStateIllustrationKey;
  children?: React.ReactNode;
};

export const EmptyStateIllustration = ({
  illustration,
  size = 'large',
}: {
  illustration?: EmptyStateIllustrationKey;
  // legacy size prop used only for legacy illustrations, only for backwards compatibility
  size?: 'small' | 'large';
}) => {
  const illustrationSrc =
    illustration && emptyStateIllustrations[illustration as TEmptyStateIllustration];
  if (illustrationSrc) {
    return (
      <ThemedImage
        lightSrc={illustrationSrc.light}
        darkSrc={illustrationSrc.dark}
        alt={illustration as string}
      />
    );
  }

  const legacyIllustrationsSrc = illustration
    ? (legacySpotIllustrations[size][illustration as TLegacyIllustrationKey<typeof size>] as string)
    : null;
  return (
    legacyIllustrationsSrc && (
      <img
        height={size === 'large' ? 240 : 96}
        width={size === 'large' ? 320 : 96}
        src={legacyIllustrationsSrc}
        alt={illustration as string}
      />
    )
  );
};

const EmptyState = ({
  children,
  title,
  description,
  size = 'large',
  illustration,
}: TEmptyState) => {
  const {
    classes: { smallContainer, largeContainer, smallText, largeText },

    cx,
  } = useStyles();
  return (
    <Flex
      classes={{
        root: cx({
          [smallContainer]: size === 'small',
          [largeContainer]: size === 'large',
        }),
      }}
      flexDirection='column'
      alignItems='center'>
      <EmptyStateIllustration illustration={illustration} size={size} />
      <Flex
        classes={{
          root: cx({
            [smallText]: size === 'small',
            [largeText]: size === 'large',
          }),
        }}
        flexDirection='column'
        alignItems='center'>
        <Typography textAlign='center' variant='h4' color='primary'>
          {title}
        </Typography>
        {description && (
          <Typography textAlign='center' color='secondary'>
            {description}
          </Typography>
        )}
      </Flex>
      {children}
    </Flex>
  );
};
EmptyState.displayName = 'EmptyState';
export default EmptyState;
