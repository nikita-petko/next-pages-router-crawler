import type { FunctionComponent } from 'react';
import { useEffect } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Grid, Paper, Typography, makeStyles } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentGame } from '@modules/providers/game/GameProvider';

export const inProgressImagePath = `${process.env.assetPathPrefix}/ownershipTransfer/inProgress.svg`;

const useInProgressTransferPageStyles = makeStyles()((theme) => ({
  root: {
    maxWidth: 600,
  },

  background: {
    maxWidth: 1024,
  },

  image: {
    maxWidth: 320,
    maxHeight: 240,
  },

  compactImage: {
    width: 160,
    height: 120,
  },

  textHeader: {
    paddingBottom: theme.spacing(1),
  },

  imageArea: {
    padding: theme.spacing(2, 2),
  },

  compactText: {
    padding: 48,
    marginBottom: 16,
  },
}));

export type InProgressTransferPageProps = {
  loadTransfer: () => void;
  compact?: boolean;
};

const InProgressTransferPage: FunctionComponent<InProgressTransferPageProps> = ({
  loadTransfer,
  compact = false,
}) => {
  const { gameDetails } = useCurrentGame();
  const { translate } = useTranslation();

  // Poll every 20 seconds: this should be maxed out by the expiration scheduler
  // failing the transfer after 1 hour (possibly sooner)
  // Expect the transfer to take up to 1-5 minutes normally
  useEffect(() => {
    const poller = setInterval(() => {
      loadTransfer();
    }, 20000);

    return () => {
      clearInterval(poller);
    };
  }, [loadTransfer]);

  const {
    classes: { root, background, image, compactImage, textHeader, imageArea, compactText },
  } = useInProgressTransferPageStyles();

  if (compact) {
    return (
      <Paper className={compactText}>
        <Grid alignItems='center' justifyContent='center' container>
          <Grid container item className={background} XSmall>
            <Typography color='primary' variant='h1'>
              {translate('Heading.TransferInProgress')}
            </Typography>
            <Typography color='secondary'>
              {translate('Description.TransferInProgress', {
                gameName: gameDetails?.name ?? '',
              })}
            </Typography>
          </Grid>
          <Grid container justifyContent='center' item style={{ maxWidth: 160 }} XSmall>
            <img
              className={compact ? compactImage : image}
              src={inProgressImagePath}
              alt='in-progress'
            />
          </Grid>
        </Grid>
      </Paper>
    );
  }

  return (
    <Grid alignItems='center' justifyContent='center' container>
      <Grid item className={root}>
        <Grid container justifyContent='center' item className={imageArea} Medium={12}>
          <img className={image} src={inProgressImagePath} alt='in-progress' />
        </Grid>
        <Grid
          container
          className={background}
          justifyContent='center'
          alignItems='center'
          alignContent='center'>
          <Typography color='primary' variant='h1' className={textHeader} align='center'>
            {translate('Heading.TransferInProgress')}
          </Typography>
          <Typography color='secondary' align='center'>
            {translate('Description.TransferInProgress', {
              gameName: gameDetails?.name ?? '',
            })}
          </Typography>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default withTranslation(InProgressTransferPage, [
  TranslationNamespace.OwnershipTransfer,
  TranslationNamespace.Payouts,
]);
