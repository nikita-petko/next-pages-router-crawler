import { makeStyles } from '@rbx/ui';

const UseBanEventStyles = (isFirstBanEvent: boolean) =>
  makeStyles()(() => ({
    timelineContainer: {
      position: 'absolute',
      left: 0,
      top: 0,
      transform: 'translateX(-50%)',
      width: isFirstBanEvent ? 30 : 20,
      height: isFirstBanEvent ? 30 : 20,
      borderRadius: '50%',
      background: isFirstBanEvent ? 'white' : '#BBBCBE',
      zIndex: 1,
    },
    banHistoryContentContainer: {
      borderLeft: '1px solid #767780',
      position: 'relative',
      paddingLeft: 40,
      paddingBottom: 20,
    },
    banHistoryText: {
      padding: '0 0 15px 0',
    },
  }));

export default UseBanEventStyles;
