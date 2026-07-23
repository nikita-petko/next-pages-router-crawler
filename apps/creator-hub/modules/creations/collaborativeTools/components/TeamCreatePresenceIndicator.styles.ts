import { makeStyles, keyframes } from '@rbx/ui';

const expandShrink = keyframes`
  '0%': {
    transform: 'scale(1)',
  },
  '42%': {
    transform: 'scale(2)',
  },
  '84%': {
    transform: 'scale(1)',
  },
`;

const useTeamCreatePresenceIndicatorStyles = makeStyles()((theme) => ({
  presenceIndicator: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    transformOrigin: 'bottom left',
    textAlign: 'center',
    display: 'flex',
    backgroundColor: theme.palette.background.default,
    alignItems: 'center',
    boxShadow: 'none',
    justifyContent: 'center',
    padding: `0 4px`,
    borderRadius: 30,
  },

  activeUserIconsContainer: {
    display: 'flex',
    flexDirection: 'row',
  },

  indicatorIcon: {
    width: 8,
    height: 8,
    margin: 'auto 4px',
    backgroundColor: theme.palette.success.main,
    borderRadius: '50%',
  },

  avatarTooltip: {
    marginTop: 8,
    fontSize: 12,
  },

  activeUserIcon: {
    borderRadius: '50%',
    height: 24,
    width: 24,
    boxShadow: `0 0 0 2px ${theme.palette.background.default}`,
    margin: '4px 0',
    zIndex: 1,
  },

  activeUserOverflow: {
    borderRadius: '50%',
    boxShadow: `0 0 0 2px ${theme.palette.background.default}`,
    height: 24,
    width: 24,
    overflow: 'visible',
    backgroundColor: theme.palette.action.hover,
    margin: '4px auto',
    marginLeft: -2,
    zIndex: 1,
  },

  indicatorIconAnimation: {
    position: 'absolute',
    width: 'inherit',
    height: 'inherit',
    backgroundColor: 'inherit',
    opacity: 0.2,
    borderRadius: 'inherit',
    animation: `${expandShrink} 1.4s ease-in-out infinite`,
  },
}));

export default useTeamCreatePresenceIndicatorStyles;
