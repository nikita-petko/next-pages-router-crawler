import { useState } from 'react';
import type { Ack } from '@rbx/client-rights/v1';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Button, Dialog, Grid, Link, makeStyles, Typography } from '@rbx/ui';
import useLocale from '@modules/charts-generic/context/useLocale';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useAckCurrentAccount from '../hooks/useAckCurrentAccount';

const useModalStyles = makeStyles()(() => {
  return {
    modalContainer: {
      paddingLeft: '50px',
      paddingRight: '50px',
      paddingTop: '30px',
      paddingBottom: '30px',
    },
    dialogContainer: {
      maxWidth: '750px',
    },
  };
});

export interface AckModalProps {
  ack: Ack;
}
/**
 *  AckModal displays the dialog modal for a specific user acknowlegdement.
 */
const AckModal = ({ ack }: AckModalProps) => {
  const { translate, translateHTML } = useTranslation();
  const {
    classes: { modalContainer, dialogContainer },
  } = useModalStyles();
  const locale = useLocale();
  const [showModal, setShowModal] = useState(true);
  const { mutate } = useAckCurrentAccount();

  const onSuccess = () => {
    setShowModal(false);
  };

  if (ack.id !== '1' && ack.id !== '2') {
    return null;
  }

  const ackText = ack.message ?? '';
  const ackCTA = ack.cta ?? '';

  const ackLinkByMessage: Record<string, string> = {
    'Label.TOSUpdateAcknowledgement': `https://en.help.roblox.com/hc/${locale}/articles/21857240911380`,
    'Label.TOSUpdateLMAcknowledgment': `https://en.help.roblox.com/hc/${locale}/articles/42542704086548-License-Manager-Terms`,
  };

  const ackLink = ackLinkByMessage[ackText] || '';

  return (
    <Dialog open={showModal} maxWidth='Large' classes={{ paper: dialogContainer }}>
      <Grid container item rowSpacing={3} className={modalContainer} direction='column'>
        <Grid container item>
          <Typography>
            {translateHTML(ackText, [
              {
                opening: 'tosLinkStart',
                closing: 'tosLinkEnd',
                content(chunks) {
                  return (
                    <Link href={ackLink} target='_blank'>
                      {chunks}
                    </Link>
                  );
                },
              },
            ])}
          </Typography>
        </Grid>
        <Grid container item>
          <Button
            onClick={() => {
              setShowModal(false);
              mutate(
                { ackId: ack.id ?? '' },
                {
                  onSuccess,
                },
              );
            }}
            variant='contained'
            fullWidth>
            {translate(ackCTA)}
          </Button>
        </Grid>
      </Grid>
    </Dialog>
  );
};

export default withTranslation(AckModal, [TranslationNamespace.RightsPortal]);
