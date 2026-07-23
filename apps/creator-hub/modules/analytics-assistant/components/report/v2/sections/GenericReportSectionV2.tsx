import React, {
  useCallback,
  forwardRef,
  useState,
  useMemo,
  useRef,
  useImperativeHandle,
} from 'react';
import { makeStyles, Card, IconButton, useTheme } from '@rbx/ui';
import useImpressionObserver from '@modules/charts-generic/charts/hooks/useImpressionObserver';
import { Flex } from '@modules/miscellaneous/components/Flex';

type GenericReportSectionV2Props = {
  children: React.ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- MUI icons have complex type signatures that are hard to fully specify
  iconComponent?: React.ComponentType<any>;
  isActive?: boolean;
  onClick?: () => void;
  onImpression?: () => void; // Callback for impression logging
};

const useGenericReportSectionStyles = makeStyles()((theme) => ({
  card: {
    backgroundColor: 'transparent',
    margin: theme.spacing(1, 0),
    borderRadius: '0',
  },
  selectableText: {
    userSelect: 'text',
  },
  clickable: {
    cursor: 'pointer',
  },
}));

const GenericReportSectionV2 = forwardRef<HTMLDivElement, GenericReportSectionV2Props>(
  ({ children, iconComponent: IconComponent, isActive = false, onClick, onImpression }, ref) => {
    const {
      classes: { card, selectableText, clickable },
      cx,
    } = useGenericReportSectionStyles();
    const theme = useTheme();
    const [isCardHovered, setIsCardHovered] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    // Expose the internal ref through the forwarded ref
    useImperativeHandle(ref, () => {
      if (cardRef.current === null) {
        throw new Error('Report section ref is not ready');
      }
      return cardRef.current;
    }, []);

    // Handle impression logging if callback is provided
    useImpressionObserver(cardRef, onImpression ?? (() => {}));

    const handleClick = useCallback(() => {
      if (onClick) {
        onClick();
      }
    }, [onClick]);

    const handleCardMouseEnter = useCallback(() => {
      setIsCardHovered(true);
    }, []);

    const handleCardMouseLeave = useCallback(() => {
      setIsCardHovered(false);
    }, []);

    const icon = useMemo(() => {
      if (!IconComponent) {
        return null;
      }

      const shouldForceHover = isCardHovered && !isActive;

      return (
        <IconButton
          aria-label='Section Action'
          size='medium'
          variant='contained'
          color={isActive ? 'primary' : 'inherit'}
          sx={{
            marginLeft: '16px',
            // Force hover styles when card is hovered and not active
            ...(shouldForceHover && {
              backgroundColor: `${theme.palette.surface[200]} !important`,
            }),
          }}>
          <IconComponent fontSize='medium' color='inherit' />
        </IconButton>
      );
    }, [IconComponent, isActive, isCardHovered, theme.palette.surface]);

    return (
      <Card
        className={cx(card, icon ? clickable : undefined)}
        onClick={icon ? handleClick : undefined}
        ref={cardRef}
        onMouseEnter={handleCardMouseEnter}
        onMouseLeave={handleCardMouseLeave}>
        <Flex justifyContent='space-between' alignItems='center'>
          <Flex flexDirection='column' classes={{ root: selectableText }}>
            {children}
          </Flex>
          {icon}
        </Flex>
      </Card>
    );
  },
);

GenericReportSectionV2.displayName = 'GenericReportSectionV2';

export default GenericReportSectionV2;
