import React, { useCallback, useState } from 'react';
import {
  Button,
  clsx,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogTitle,
  Icon,
  IconButton,
  Menu,
  MenuItem,
  MenuSection,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import useSnackbarAlert from '@modules/miscellaneous/hooks/useSnackbarAlert';
import useReportTicketMutation from '../hooks/useReportTicketMutation';

export interface TicketActionsMenuProps {
  universeId: number;
  ticketId: string;
  /**
   * When false, the kebab is hidden until the parent `group` is hovered or
   * focused; when true (e.g. mobile cards, ticket detail page), it always
   * renders. The trigger is also forced visible while the popover is open so
   * the menu stays anchored after the cursor leaves the row.
   */
  alwaysVisible?: boolean;
  /** Surface this menu is rendered on, used to disambiguate analytics events. */
  surface?: 'list' | 'detail';
  onReported?: () => void;
}

/**
 * Vertical kebab + popover menu shown alongside a ticket. Currently exposes a
 * single "Report" action that — after a confirmation dialog — escalates the
 * ticket to Roblox via `useReportTicketMutation`. Stops click/keydown
 * propagation so it can sit inside a row that's also acting as a link.
 */
const TicketActionsMenu: React.FunctionComponent<TicketActionsMenuProps> = ({
  universeId,
  ticketId,
  alwaysVisible = false,
  surface,
  onReported,
}) => {
  const { translate } = useTranslation();
  const showSnackbarMessage = useSnackbarAlert();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const { mutate: reportTicket, isPending: isReporting } = useReportTicketMutation({
    universeId,
    ticketId,
    onSuccess: () => {
      setIsConfirmOpen(false);
      showSnackbarMessage(
        'success',
        translate('Message.PlayerSupport.ReportSupportRequestSuccess'),
      );
      onReported?.();
    },
    onError: () => {
      setIsConfirmOpen(false);
      showSnackbarMessage('error', translate('Message.PlayerSupport.ReportSupportRequestError'));
    },
  });

  const handleReportSelected = useCallback(() => {
    unifiedLoggerClient.logClickEvent({
      eventName: 'playerSupport.selectReport',
      parameters: {
        universeId: String(universeId),
        ticketId,
        surface: surface ?? '',
      },
    });
    // Close the popover first so it doesn't fight with the dialog's focus trap.
    setIsMenuOpen(false);
    setIsConfirmOpen(true);
  }, [universeId, ticketId, surface]);

  const handleConfirmReport = useCallback(() => {
    unifiedLoggerClient.logClickEvent({
      eventName: 'playerSupport.confirmReport',
      parameters: {
        universeId: String(universeId),
        ticketId,
        surface: surface ?? '',
      },
    });
    reportTicket();
  }, [reportTicket, universeId, ticketId, surface]);

  const handleCancelReport = useCallback(() => {
    setIsConfirmOpen(false);
  }, []);

  const stopPropagation = useCallback((e: React.SyntheticEvent) => {
    e.stopPropagation();
  }, []);

  // Foundation Tailwind exposes `opacity` only via arbitrary values, so use
  // the first-class `invisible`/`visible` utilities instead.
  const visibilityClass = clsx(
    alwaysVisible || isMenuOpen || isConfirmOpen
      ? 'visible'
      : 'invisible group-hover:visible group-focus-within:visible',
  );

  return (
    <div
      className={visibilityClass}
      onClick={stopPropagation}
      onKeyDown={stopPropagation}
      role='presentation'>
      <Popover open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <PopoverTrigger asChild>
          <IconButton
            as='button'
            icon='icon-filled-three-dots-vertical'
            size='Small'
            variant='Utility'
            isCircular
            isDisabled={isReporting}
            ariaLabel={translate('Action.MoreOptions')}
          />
        </PopoverTrigger>
        <PopoverContent side='bottom' align='end' ariaLabel={translate('Action.MoreOptions')}>
          <Menu size='Medium'>
            <MenuSection>
              <MenuItem
                value='report'
                title={translate('Action.Report')}
                leading={<Icon name='icon-regular-flag' size='Small' />}
                disabled={isReporting}
                onSelect={handleReportSelected}
              />
            </MenuSection>
          </Menu>
        </PopoverContent>
      </Popover>
      <Dialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        isModal
        size='Medium'
        hasCloseAffordance={false}>
        <DialogContent className='width-full'>
          <DialogBody className='gap-xsmall flex flex-col'>
            <DialogTitle className='text-heading-small margin-y-none padding-bottom-xsmall'>
              {translate('Description.PlayerSupport.ConfirmReportTicket')}
            </DialogTitle>
            <span className='content-default text-body-medium'>
              {translate('Description.PlayerSupport.ConfirmReportTicketDesc')}
            </span>
          </DialogBody>
          <DialogFooter className='gap-small flex flex-row'>
            <Button
              variant='Standard'
              size='Medium'
              className='grow-1 basis-0'
              isDisabled={isReporting}
              onClick={handleCancelReport}>
              {translate('Action.Cancel')}
            </Button>
            <Button
              variant='Alert'
              size='Medium'
              className='grow-1 basis-0'
              isLoading={isReporting}
              onClick={handleConfirmReport}>
              {translate('Action.Report')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TicketActionsMenu;
