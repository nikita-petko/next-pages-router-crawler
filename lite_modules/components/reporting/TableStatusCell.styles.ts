import { makeStyles } from '@rbx/ui';

import { StatusText } from '@constants/campaignStatus';

const useTableStatusCellStyles = makeStyles<{ status: StatusText }>()((theme, { status }) => {
  let color: string = theme.palette.content.disabled;
  switch (status) {
    case StatusText.DISPLAY_STATUS_PAUSED:
    case StatusText.DISPLAY_STATUS_SCHEDULED:
    case StatusText.DISPLAY_STATUS_INACTIVE:
    case StatusText.DISPLAY_STATUS_MODERATED_INACTIVE:
    case StatusText.DISPLAY_STATUS_PARENT_CAMPAIGN_IS_PAUSED:
    case StatusText.DISPLAY_STATUS_PARENT_AD_SET_IS_PAUSED:
    case StatusText.DISPLAY_STATUS_PRIVATE:
    case StatusText.DISPLAY_STATUS_PLACE_JOIN_RESTRICTED:
      color = theme.palette.content.disabled;
      break;
    case StatusText.DISPLAY_STATUS_ERROR:
    case StatusText.DISPLAY_STATUS_CANCELED:
    case StatusText.DISPLAY_STATUS_PARENT_CAMPAIGN_IS_CANCELED:
    case StatusText.DISPLAY_STATUS_REJECTED:
    case StatusText.DISPLAY_STATUS_CLICKBAIT:
    case StatusText.DISPLAY_STATUS_GAME_FILTERED:
      color = theme.palette.content.alert.important;
      break;
    case StatusText.DISPLAY_STATUS_COMPLETED:
    case StatusText.DISPLAY_STATUS_AUTO_COMPLETED:
      color = theme.palette.content.action;
      break;
    case StatusText.DISPLAY_STATUS_IN_REVIEW:
    case StatusText.DISPLAY_STATUS_PROCESSING:
    case StatusText.DISPLAY_STATUS_MODERATED_ACTIVE:
      color = theme.palette.content.alert.notice;
      break;
    case StatusText.DISPLAY_STATUS_ACTIVE:
    case StatusText.DISPLAY_STATUS_LEARNING:
      color = theme.palette.content.alert.active;
      break;
    default:
      color = theme.palette.content.disabled;
      break;
  }

  return {
    labelClasses: {
      backgroundColor: '#d0d9fb14',
      fontSize: '12px',
      gap: '6px',
      padding: '2px 8px',
      whiteSpace: 'nowrap',
    },

    statusCellContent: {
      minWidth: 110,
    },

    statusCircle: {
      backgroundColor: color,
      borderRadius: '50%',
      maxHeight: '8px',
      maxWidth: '8px',
    },
  };
});

export default useTableStatusCellStyles;
