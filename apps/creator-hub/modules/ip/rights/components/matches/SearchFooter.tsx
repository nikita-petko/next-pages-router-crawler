import { makeStyles } from '@rbx/ui';
import React from 'react';

const useSearchFooterStyles = makeStyles()((theme) => ({
  footer: {
    rowGap: 12,
    backgroundColor: theme.palette.components.stickyFooter.fill,
    backdropFilter: 'blur(50px);',
    transition: 'opacity 0.2s',
    position: 'sticky',
    bottom: 0,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'stretch',
    display: 'flex',
  },
  containerPadding: {
    paddingTop: 24,
    [theme.breakpoints.down('Medium')]: {
      paddingTop: 16,
    },
  },
  visible: {
    bottom: 0,
    opacity: 1,
  },
  hidden: {
    opacity: 0,
    pointerEvents: 'none',
  },
}));

/**
 * SearchFooter is forked from sticky footer to work well with infinite scroll
 */
const SearchFooter = ({
  children,
  isVisible,
}: {
  children: React.ReactNode;
  isVisible: boolean;
}) => {
  const {
    classes: { footer, containerPadding, visible, hidden },
  } = useSearchFooterStyles();

  return (
    <div className={`${footer} ${containerPadding} ${isVisible ? visible : hidden} `}>
      {children}
    </div>
  );
};
export default SearchFooter;
