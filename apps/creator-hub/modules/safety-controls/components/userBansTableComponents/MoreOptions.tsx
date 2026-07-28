import React, { useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { IconButton, Menu, MenuItem, MoreVertIcon, Typography } from '@rbx/ui';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { ModerationEvents } from '@modules/safety-controls/constants/userBansConstants';
import BanHistoryDialog from './BanHistoryDialog/BanHistoryDialog';
import UseMoreOptionsStyles from './MoreOptions.styles';

type MoreOptionsProps = {
  universeId: number;
  userId: number;
};

const MoreOptions = ({ universeId, userId }: MoreOptionsProps) => {
  const {
    classes: { buttonContainer },
  } = UseMoreOptionsStyles();
  const [anchorElem, setAnchorElem] = useState<null | HTMLElement>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  const { translate } = useTranslation();
  const { unifiedLogger } = useUnifiedLoggerProvider();

  const handleOpenBanHistory = () => {
    setIsDialogOpen(true);

    unifiedLogger.logClickEvent({
      eventName: ModerationEvents.SEE_BAN_HISTORY_CLICK_EVENT,
      parameters: {
        userId: userId.toString(),
      },
    });
  };

  return (
    <>
      <IconButton
        classes={{ root: buttonContainer }}
        aria-label='More'
        color='default'
        onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
          setAnchorElem(event.currentTarget);
        }}>
        <MoreVertIcon fontSize='large' />
      </IconButton>
      <Menu
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        anchorEl={anchorElem}
        open={!!anchorElem}
        onClose={() => setAnchorElem(null)}>
        <MenuItem onClick={handleOpenBanHistory}>
          <Typography>{translate('Label.SeeBanHistory')}</Typography>
        </MenuItem>
      </Menu>
      <BanHistoryDialog
        universeId={universeId}
        userId={userId}
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </>
  );
};

export default MoreOptions;
