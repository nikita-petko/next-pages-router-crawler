import type { FC } from 'react';
import React, { useCallback } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Button, InputAdornment, TextField, Typography, useSnackbar } from '@rbx/ui';
import { toastDurationTime } from '@modules/miscellaneous/common';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

export type TTokenIdComponentProps = {
  tokenId: string;
};

const TokenIdComponent: FC<React.PropsWithChildren<TTokenIdComponentProps>> = ({ tokenId }) => {
  const { translate } = useTranslation();

  const { enqueue, close: closeSnackbar } = useSnackbar();
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

  return (
    <div>
      <Typography variant='h6'>{translate('Label.TokenId')}</Typography>
      <br />
      <TextField
        style={{ marginTop: '20px' }}
        fullWidth
        id='tokenId'
        label=''
        disabled
        value={tokenId}
        InputProps={{
          endAdornment: (
            <InputAdornment position='end'>
              <Button
                color='secondary'
                variant='contained'
                onClick={() => {
                  navigator.clipboard.writeText(tokenId);
                  showBottomMsg(
                    translate('Message.CopySuccess', { item: translate('Label.TokenId') }),
                  );
                }}>
                {translate('Action.CopyItem', { item: '' })}
              </Button>
            </InputAdornment>
          ),
        }}
      />
    </div>
  );
};

export default withTranslation(TokenIdComponent, [
  TranslationNamespace.Creations,
  TranslationNamespace.ConfigureItem,
]);
