import { useRouter } from 'next/router';
import type { FunctionComponent } from 'react';
import React, { useCallback } from 'react';
import { useTranslation } from '@rbx/intl';
import {
  Divider,
  EditOutlinedIcon,
  FileCopyOutlinedIcon,
  LaunchIcon,
  ListItemIcon,
  Menu,
  MenuItem,
  Typography,
  useMediaQuery,
  useSnackbar,
} from '@rbx/ui';
import { toastDurationTime } from '@modules/miscellaneous/common';
import useCurrentEvent from '../../hooks/useCurrentEvent';
import { getConfigureEventUrl, getEventDetailsUrl } from '../../utils/eventUtils';
import { tableStackViewBreakpoint } from '../common/constants';
import ChangePrivacyMenuItem from './ChangePrivacyMenuItem';
import DeleteEventMenuItem from './DeleteEventMenuItem';
import useEventListStyles from './EventList.styles';

export interface EventListContextMenuProps {
  menuOpen?: boolean;
  anchorEl: HTMLButtonElement | null;
  handleRemove: () => void;
  handleClose: () => void;
}

const EventListContextMenu: FunctionComponent<
  React.PropsWithChildren<EventListContextMenuProps>
> = ({ menuOpen = false, anchorEl, handleRemove, handleClose }) => {
  const { translate } = useTranslation();
  const { eventDetails } = useCurrentEvent();
  const { enqueue, close: closeSnackbar } = useSnackbar();
  const router = useRouter();

  const eventUrl = getEventDetailsUrl(eventDetails?.id ?? '');
  const configureEventUrl = getConfigureEventUrl(
    eventDetails?.universeId ?? '',
    eventDetails?.id ?? '',
  );
  const isStackView = useMediaQuery((theme) => theme.breakpoints.down(tableStackViewBreakpoint));

  const {
    classes: { contextMenu },
  } = useEventListStyles();

  const showBottomMsg = useCallback(
    (msg: string) => {
      enqueue({
        message: <span data-testid='success-message'>{msg}</span>,
        anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
        autoHideDuration: toastDurationTime,
        autoHide: true,
        onClose: closeSnackbar,
      });
    },
    [enqueue, closeSnackbar],
  );

  const copyEventId = useCallback(() => {
    navigator.clipboard.writeText(String(eventDetails?.id));
    showBottomMsg(translate('Message.Copied'));
    handleClose();
  }, [eventDetails, handleClose, showBottomMsg, translate]);

  const copyEventUrl = useCallback(() => {
    navigator.clipboard.writeText(eventUrl);
    showBottomMsg(translate('Message.Copied'));
    handleClose();
  }, [eventUrl, handleClose, showBottomMsg, translate]);

  const openEventPage = useCallback(() => {
    window.open(eventUrl);
  }, [eventUrl]);

  return (
    <Menu
      open={menuOpen}
      anchorEl={anchorEl}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      className={contextMenu}>
      <MenuItem onClick={copyEventUrl}>
        <ListItemIcon>
          <FileCopyOutlinedIcon />
        </ListItemIcon>
        <Typography>{translate('Action.CopyEventURL')}</Typography>
      </MenuItem>
      <MenuItem onClick={copyEventId}>
        <ListItemIcon>
          <FileCopyOutlinedIcon />
        </ListItemIcon>

        <Typography>{translate('Action.CopyEventID')}</Typography>
      </MenuItem>
      <MenuItem onClick={openEventPage}>
        <ListItemIcon>
          <LaunchIcon />
        </ListItemIcon>

        <Typography>{translate('Label.ViewOnRoblox')}</Typography>
      </MenuItem>
      {!isStackView && <Divider />}
      <ChangePrivacyMenuItem handleClose={handleClose} />
      <MenuItem
        onClick={() => {
          router.push(configureEventUrl);
        }}>
        <ListItemIcon>
          <EditOutlinedIcon />
        </ListItemIcon>
        <Typography>{translate('Action.Edit')}</Typography>
      </MenuItem>
      {!isStackView && <Divider />}
      <DeleteEventMenuItem handleClose={handleClose} removeItem={handleRemove} />
    </Menu>
  );
};

export default EventListContextMenu;
