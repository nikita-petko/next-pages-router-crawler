import type { FC, ReactNode } from 'react';
import React, { useEffect, useRef } from 'react';
import { IconButton } from '@rbx/foundation-ui';
import type { TIconProps } from '@rbx/ui';
import { Card, CardContent, CardHeader, Grid, Typography } from '@rbx/ui';
import type { TranslationKey } from '@modules/analytics-translations/types';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { Flex } from '@modules/miscellaneous/components/Flex';
import useAssistantCardStyles from '../AssistantCard.styles';

interface GenericCanvasCardHeader {
  titleKey: TranslationKey;
  icon?: React.ComponentType<TIconProps>;
}

interface GenericCanvasCardProps {
  header?: GenericCanvasCardHeader;
  headerControls?: ReactNode;
  children: ReactNode;
  onClose?: () => void;
  closeAriaLabel?: string;
}

/**
 * A generic canvas card component that can be used across different assistant surfaces.
 * Provides optional header with title and icon, and renders children as content.
 */
const GenericCanvasCard: FC<GenericCanvasCardProps> = ({
  header,
  headerControls,
  children,
  onClose,
  closeAriaLabel,
}) => {
  const {
    classes: {
      contentContainer,
      header: headerClass,
      headerAction,
      card,
      cardContent,
      titleItem,
      fullHeight,
    },
    cx,
  } = useAssistantCardStyles();
  const { translate } = useRAQIV2TranslationDependencies();

  const cardContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cardContentRef.current) {
      cardContentRef.current.scrollTop = 0;
    }
  }, [children]);

  return (
    <Card className={cx(card, contentContainer, fullHeight)}>
      {header && (
        <CardHeader
          className={headerClass}
          classes={{ action: headerAction }}
          title={
            <Flex justifyContent='flex-start'>
              <Grid container alignItems='center' direction='row'>
                {header.icon && (
                  <header.icon color='disabled' fontSize='medium' className={titleItem} />
                )}
                <Typography variant='captionHeader' color='secondary'>
                  {translate(header.titleKey)}
                </Typography>
                {headerControls}
              </Grid>
            </Flex>
          }
          action={
            onClose ? (
              <IconButton
                type='button'
                variant='Standard'
                size='XSmall'
                icon='icon-filled-x'
                ariaLabel={closeAriaLabel ?? 'Close'}
                onClick={onClose}
              />
            ) : undefined
          }
        />
      )}
      <CardContent className={cardContent} ref={cardContentRef}>
        {children}
      </CardContent>
    </Card>
  );
};

export default GenericCanvasCard;
