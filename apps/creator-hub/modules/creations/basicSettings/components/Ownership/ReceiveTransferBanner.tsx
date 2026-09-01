import type { FunctionComponent } from 'react';
import React, { Fragment, useEffect, useState } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { ReturnPolicy, ThumbnailClient, ThumbnailFormat, ThumbnailTypes } from '@rbx/thumbnails';
import { Banner, Grid } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import ReceiveTransferDialog from './ReceiveTransferDialog';
import type { ReceiveTransferDialogStage } from './types';

export type ReceiveTransferBannerProps = {
  onSubmit?: () => void;
};

const ReceiveTransferBanner: FunctionComponent<
  React.PropsWithChildren<ReceiveTransferBannerProps>
> = ({ onSubmit }) => {
  const { translate } = useTranslation();
  const { gameDetails } = useCurrentGame();

  // States are controlled here so the button will properly reset states without flashing
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [transferDialogStage, setTransferDialogStage] =
    useState<ReceiveTransferDialogStage>('Information');
  // checkbox - disclaimer stage
  const [isImplicationsAcknowledged, setIsImplicationsAcknowledged] = useState<boolean>(false);
  // input experience name textfield - verification stage
  const [nameVerificationText, setNameVerificationText] = useState<string>('');

  const [isBannerButtonLoading, setIsBannerButtonLoading] = useState<boolean>(false);
  const [thumbnail, setThumbnail] = useState<string>('');

  useEffect(() => {
    const getThumbnail = async () => {
      if (gameDetails?.id) {
        const thumbnailUrl = await ThumbnailClient.getThumbnailImage(
          ThumbnailTypes.gameIcon,
          gameDetails?.id,
          ReturnPolicy.PlaceHolder,
          ThumbnailFormat.webp,
          '512x512',
        );
        setThumbnail(thumbnailUrl?.imageUrl ?? '');
      }
    };
    getThumbnail();
  }, [gameDetails?.id]);

  return (
    <>
      <Grid container style={{ marginBottom: 16 }}>
        <Banner
          title={translate('Title.RequestToOwn', { gameName: gameDetails?.name ?? '' })}
          description={translate('Description.RequestToOwn', { gameName: gameDetails?.name ?? '' })}
          primary={{
            variant: 'contained',
            size: 'small',
            color: 'primaryBrand',
            loading: isBannerButtonLoading,
            onClick: () => {
              setIsImplicationsAcknowledged(false);
              setTransferDialogStage('Information');
              setNameVerificationText('');
              setDialogOpen(true);
            },
            label: translate('Action.ViewToAccept'),
          }}
          illustration={{ src: thumbnail, alt: 'experience-thumbnail' }}
        />
      </Grid>
      <ReceiveTransferDialog
        dialogOpen={dialogOpen}
        setDialogOpen={setDialogOpen}
        transferDialogStage={transferDialogStage}
        setTransferDialogStage={setTransferDialogStage}
        isImplicationsAcknowledged={isImplicationsAcknowledged}
        setIsImplicationsAcknowledged={setIsImplicationsAcknowledged}
        nameVerificationText={nameVerificationText}
        setNameVerificationText={setNameVerificationText}
        setIsBannerButtonLoading={setIsBannerButtonLoading}
        onSubmit={onSubmit}
      />
    </>
  );
};

export default withTranslation(ReceiveTransferBanner, [
  TranslationNamespace.OwnershipTransfer,
  TranslationNamespace.Payouts,
]);
