import React, { useCallback } from 'react';
import type { AgreementActivityResponse } from '@rbx/client-content-licensing-api/v1';
import { Icon } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { IconButton, Menu, MenuItem, MoreHorizIcon } from '@rbx/ui';
import { LicenseManagerClickEvent, useLicenseManagerLogger } from '../license-manager/utils/logger';

export const getAbuseReportingUrl = (id: string, sender: string, message: string) => {
  const newSender = encodeURIComponent(sender);
  const newMessage = encodeURIComponent(message);

  const params = new URLSearchParams({
    abuseVector: 'ip_license_message',
    targetId: id,
    custom: JSON.stringify({
      reminder: {
        title: btoa(newSender),
        message: btoa(newMessage),
      },
    }),
  });

  return `https://www.${process.env.robloxSiteDomain}/report-abuse/?${params.toString()}`;
};

interface ReportMenuProps {
  isCreator: boolean;
  creatorName: string;
  listingName: string;
  agreementActivity: AgreementActivityResponse;
}

/**
 * A menu component that provides a "Report Message" option for user-submitted messages.
 * Displays a three-dot menu button that opens a dropdown with a flag icon and report action.
 * Logs analytics events when the report action is clicked and opens the abuse reporting page.
 */
const ReportIpMessageMenu = ({
  isCreator,
  creatorName,
  listingName,
  agreementActivity,
}: ReportMenuProps) => {
  const { translate } = useTranslation();
  const { logEvent } = useLicenseManagerLogger();

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const openReportPage = useCallback(() => {
    const agreementActivityId = agreementActivity.id!;

    logEvent(
      isCreator
        ? LicenseManagerClickEvent.CreatorAgreementDetailsPageOpenAbuseReportingClickEvent
        : LicenseManagerClickEvent.IphAgreementDetailsPageOpenAbuseReportingClickEvent,
      {
        agreementActivityId,
      },
    );

    window.open(
      getAbuseReportingUrl(
        agreementActivityId,
        isCreator ? listingName : creatorName,
        agreementActivity.notes!,
      ),
    );
  }, [logEvent, isCreator, agreementActivity, listingName, creatorName]);

  return (
    <>
      <IconButton
        size='small'
        onClick={handleMenuOpen}
        aria-label={translate('Action.MoreOptions')}
        color='secondary'>
        <MoreHorizIcon />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <MenuItem onClick={openReportPage}>
          <Icon name='icon-regular-flag' style={{ marginRight: 5 }} />
          {translate('Action.ReportMessage')}
        </MenuItem>
      </Menu>
    </>
  );
};

export default ReportIpMessageMenu;
