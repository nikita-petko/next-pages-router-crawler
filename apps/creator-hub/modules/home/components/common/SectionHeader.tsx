import React, { FunctionComponent } from 'react';
import { Typography, IconButton, NavigateNextIcon, makeStyles } from '@rbx/ui';
import { components } from '@modules/miscellaneous/common';

const { Flex } = components;

const useStyles = makeStyles()({
  root: {
    marginBottom: 16,
  },
  headerContainer: {
    gap: 2,
  },
  container: {
    marginLeft: 'auto',
  },
});

type TSectionHeaderProps = {
  header: React.ReactNode;
  body?: React.ReactNode;
  viewAllHref?: string;
  onViewAllClick?: () => void;
  adornment?: React.ReactNode;
};

const SectionHeader: FunctionComponent<React.PropsWithChildren<TSectionHeaderProps>> = ({
  header,
  body,
  viewAllHref,
  onViewAllClick,
  adornment,
}) => {
  const {
    classes: { root, headerContainer, container },
  } = useStyles();
  return (
    <Flex classes={{ root }} alignItems='center'>
      <Flex flexDirection='column'>
        <Flex classes={{ root: headerContainer }} alignItems='center'>
          <Typography variant='h5'>{header}</Typography>
          {viewAllHref && (
            <a href={viewAllHref} onClick={onViewAllClick} target='_self'>
              <IconButton size='small' color='default' aria-label='view all'>
                <NavigateNextIcon />
              </IconButton>
            </a>
          )}
        </Flex>
        <Typography color='secondary' variant='body2'>
          {body}
        </Typography>
      </Flex>
      <div className={container}>{adornment}</div>
    </Flex>
  );
};

export default SectionHeader;
