import React from 'react';
import {
  CampaignIcon,
  CheckIcon,
  CopyrightIcon,
  EditIcon,
  EditOffIcon,
  EmojiEmotionsIcon,
  ErrorIcon,
  EventIcon,
  NotificationsIcon,
  PlayArrowIcon,
  SmartDisplayIcon,
  TranslateOutlinedIcon,
  UpdateIcon,
  WarningIcon,
  PersonAddIcon,
  InfoOutlinedIcon,
  PeopleIcon,
  AttachMoneyIcon,
  BarChartIcon,
} from '@rbx/ui';
import { Icon as FoundationIcon } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';

/**
 * NOTE (@mbae, 03/07/24): Studio and Creator Hub use the same API contract, and
 * given the lack of ability to use MUI in Studio, we maintain a map of strings
 * to icons for consistency in API contract interpretation
 */

// Pre-M2 Legacy icon map
const NOTIFICATION_ICON_MAP: Record<string, React.JSX.Element> = {
  CampaignFilledNeutral: <CampaignIcon color='action' />,
  CheckFilledPositive: <CheckIcon color='success' />,
  CopyrightNeutral: <CopyrightIcon color='action' />,
  CopyrightWarning: <CopyrightIcon color='warning' />,
  CopyrightNegative: <CopyrightIcon color='error' />,
  CreateFilledEmphasis: <EditIcon color='info' />,
  CreateFilledNeutral: <EditIcon color='action' />,
  CreateFilledWarning: <EditIcon color='warning' />,
  EditOffFilledNegative: <EditOffIcon color='error' />,
  ErrorFilledError: <ErrorIcon color='error' />,
  EventNeutral: <EventIcon color='action' />,
  HappyFilledNeutral: <EmojiEmotionsIcon color='action' />,
  NotificationBell: <NotificationsIcon color='action' />,
  PlayArrowFilledEmphasis: <PlayArrowIcon color='primary' />,
  PlayArrowFilledNeutral: <PlayArrowIcon color='action' />,
  PlayArrowFilledWarning: <PlayArrowIcon color='warning' />,
  PlayDisabledFilledNegative: <PlayArrowIcon color='error' />,
  TranslateFilledNeutral: <TranslateOutlinedIcon color='action' />,
  UpdateFilledEmphasis: <UpdateIcon color='primary' />,
  UpdateFilledNegative: <UpdateIcon color='error' />,
  UpdateFilledPositive: <UpdateIcon color='success' />,
  UpdateFilledWarning: <UpdateIcon color='warning' />,
  VideoCamFilledNeutral: <SmartDisplayIcon color='action' />,
  VideoCamFilledEmphasis: <SmartDisplayIcon color='primary' />,
  WarningFilledWarning: <WarningIcon color='warning' />,
  PersonAdd: <PersonAddIcon color='info' />,
  InfoFilledEmphasis: <InfoOutlinedIcon color='info' />,
  InfoFilledNeutral: <InfoOutlinedIcon color='action' />,
  PeopleFilled: <PeopleIcon color='action' />,
  AttachMoney: <AttachMoneyIcon color='action' />,
  BarChartNeutral: <BarChartIcon color='action' />,
};

// note: icon class names have to appear in source code
// to be added to CSS output
const M2_ICON_MAP_BY_TARGET_ID: Record<string, React.JSX.Element> = {
  FilledBell: (
    <FoundationIcon
      name='icon-filled-bell'
      size='XLarge'
      className='content-emphasis'
      style={{ fontSize: 28 }}
    />
  ),
  FilledAlert: (
    <FoundationIcon
      name='icon-filled-triangle-exclamation'
      size='XLarge'
      className='content-emphasis'
      style={{ fontSize: 28 }}
    />
  ),
  FilledTriangleExclamation: (
    <FoundationIcon
      name='icon-filled-triangle-exclamation'
      size='XLarge'
      className='content-emphasis'
      style={{ fontSize: 28 }}
    />
  ),
  FilledClock: (
    <FoundationIcon
      name='icon-filled-clock'
      size='XLarge'
      className='content-emphasis'
      style={{ fontSize: 28 }}
    />
  ),
  FilledDocumentCircleSlash: (
    <FoundationIcon
      name='icon-filled-document-circle-slash'
      size='XLarge'
      className='content-emphasis'
      style={{ fontSize: 28 }}
    />
  ),
};

type NotificationIconProps = {
  targetId?: string;
  enableNotificationsM2?: boolean;
};

const NotificationIcon: React.FC<NotificationIconProps> = ({
  targetId = 'RegularBell',
  enableNotificationsM2 = false,
}) => {
  const { translate } = useTranslation();

  let component = null;
  if (enableNotificationsM2) {
    component = M2_ICON_MAP_BY_TARGET_ID[targetId] || M2_ICON_MAP_BY_TARGET_ID.FilledBell;
  } else {
    component = NOTIFICATION_ICON_MAP[targetId] || NOTIFICATION_ICON_MAP.NotificationBell;
  }

  return React.cloneElement(component, {
    alt: translate('Label.Icon'),
    style: { fontSize: 28 },
  });
};

export default NotificationIcon;
