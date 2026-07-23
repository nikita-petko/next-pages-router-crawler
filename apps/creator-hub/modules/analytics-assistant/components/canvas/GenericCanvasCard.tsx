import React, { FC, useEffect, useRef, ReactNode } from 'react';
import { Card, CardContent, CardHeader, Grid, Typography, TIconProps } from '@rbx/ui';
import { Flex } from '@modules/miscellaneous/common/components';
import { useRAQIV2TranslationDependencies } from '@modules/experience-analytics-shared';
import { TranslationKey } from '@modules/analytics-translations';
import useAssistantCardStyles from '../AssistantCard.styles';

interface GenericCanvasCardHeader {
  titleKey: TranslationKey;
  icon: React.ComponentType<TIconProps>;
}

interface GenericCanvasCardProps {
  header?: GenericCanvasCardHeader;
  children: ReactNode;
}

/**
 * A generic canvas card component that can be used across different assistant surfaces.
 * Provides optional header with title and icon, and renders children as content.
 */
const GenericCanvasCard: FC<GenericCanvasCardProps> = ({ header, children }) => {
  const {
    classes: { contentContainer, header: headerClass, card, cardContent, titleItem, fullHeight },
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
          title={
            <Flex justifyContent='flex-start'>
              <Grid container alignItems='center' direction='row'>
                <header.icon color='disabled' fontSize='medium' className={titleItem} />
                <Typography variant='captionHeader' color='secondary'>
                  {translate(header.titleKey)}
                </Typography>
              </Grid>
            </Flex>
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
