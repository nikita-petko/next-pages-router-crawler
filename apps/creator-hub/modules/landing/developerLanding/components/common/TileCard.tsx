import type { FunctionComponent } from 'react';
import React, { useMemo } from 'react';
import { Icon } from '@rbx/foundation-ui';
import type { DashboardOutlinedIcon, RobuxIcon } from '@rbx/ui';
import { Typography, makeStyles, CardActionArea, CardContent } from '@rbx/ui';
import { Flex } from '@modules/miscellaneous/components/Flex';
import type { TFoundationIconName } from '../../constants/contentConstants';
import { CardContainer } from './CardContainer';

type TTileCardProps = {
  title: string;
  description: string;
  IconComponent?: typeof DashboardOutlinedIcon | typeof RobuxIcon | TFoundationIconName;
  classes?: Partial<{ root: string }>;
  url?: string;
  onClick?: () => void;
};

const useStyles = makeStyles()(() => ({
  card: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  cardIcon: {
    marginRight: 15,
  },
  cardTitle: {
    paddingBottom: 5,
  },
  contentContainer: {
    width: '100%',
    height: '100%',
    display: 'flex',
    padding: 22,
  },
}));

const TileCard: FunctionComponent<React.PropsWithChildren<TTileCardProps>> = ({
  title,
  description,
  url,
  IconComponent,
  classes,
  onClick,
}) => {
  const {
    classes: { card, cardIcon, cardTitle, contentContainer },
  } = useStyles();

  const renderedIcon = useMemo(() => {
    if (!IconComponent) {
      return null;
    }
    if (typeof IconComponent === 'string') {
      return (
        <span className={cardIcon}>
          <Icon name={IconComponent} size='Small' className='content-default' />
        </span>
      );
    }
    return <IconComponent classes={{ root: cardIcon }} fontSize='small' color='disabled' />;
  }, [IconComponent, cardIcon]);

  if (url !== undefined) {
    return (
      <CardContainer classes={classes} key={title}>
        <CardActionArea classes={{ root: card }} disableRipple href={url} onClick={onClick}>
          <CardContent classes={{ root: contentContainer }}>
            {renderedIcon}
            <Flex flexDirection='column'>
              <Typography classes={{ root: cardTitle }} variant='h6'>
                {title}
              </Typography>
              <Typography variant='body2' color='secondary'>
                {description}
              </Typography>
            </Flex>
          </CardContent>
        </CardActionArea>
      </CardContainer>
    );
  }

  return (
    <CardContainer classes={classes} key={title}>
      <CardContent classes={{ root: contentContainer }}>
        {renderedIcon}
        <Flex flexDirection='column'>
          <Typography classes={{ root: cardTitle }} variant='h6'>
            {title}
          </Typography>
          <Typography variant='body2' color='secondary'>
            {description}
          </Typography>
        </Flex>
      </CardContent>
    </CardContainer>
  );
};

export default TileCard;
