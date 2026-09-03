import { DialogHeroMedia, DialogTitle } from '@rbx/foundation-ui';
import { UIThemeProvider } from '@rbx/ui';
import { RobloxVideoPlayer } from '@rbx/video-player';
import { type ReactElement, useState } from 'react';

import { openDialog } from '@components/common/dialog/actions';
import type { BaseInjectedDialogProps } from '@components/common/dialog/types';
import styles from '@components/common/dialogs/GamePreviewVideoDialog.module.css';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import useResolvedThemeMode from '@hooks/useResolvedThemeMode';
import { CaptureException } from '@utils/error';
import { GetVideoPlayerEnvEnum } from '@utils/url';

interface GamePreviewVideoDialogProps extends BaseInjectedDialogProps {
  assetId: string;
}

const GamePreviewVideoDialog = ({ assetId }: GamePreviewVideoDialogProps): ReactElement => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Report);
  const { translate: translateCampaign } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const themeMode = useResolvedThemeMode();
  const [hasLoadError, setHasLoadError] = useState<boolean>(false);

  return (
    <UIThemeProvider theme={themeMode}>
      <DialogHeroMedia className={styles.heroMedia}>
        {hasLoadError ? (
          <div className={styles.error} role='alert'>
            {translateCampaign('Description.VideoPreviewUnavailable')}
          </div>
        ) : (
          <RobloxVideoPlayer
            autoPlay
            className={styles.video}
            environment={GetVideoPlayerEnvEnum()}
            loop
            muted
            onLoadError={(error) => {
              CaptureException(error, {
                assetId,
                context: 'Failed to load sponsored universe game preview video dialog',
              });
              setHasLoadError(true);
            }}
            videoAssetId={assetId}
          />
        )}
      </DialogHeroMedia>
      <DialogTitle hidden>{translate('Heading.AssetPreview')}</DialogTitle>
    </UIThemeProvider>
  );
};

export const openGamePreviewVideoDialog = (assetId: string): void => {
  openDialog({
    component: GamePreviewVideoDialog,
    options: { hasCloseAffordance: true, size: 'Medium' },
    props: { assetId },
  });
};

export default GamePreviewVideoDialog;
