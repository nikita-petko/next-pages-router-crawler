import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { CircularProgress, Grid, useMediaQuery, useTheme } from '@rbx/ui';
import { FailureView } from '@modules/miscellaneous/common/components/FailureView';
import { useRouter } from 'next/router';
import { useSettings } from '@modules/settings';
import useOverviewStyles from '../../common/components/Overview.styles';
import useCurrentLook from '../hooks/useCurrentLook';
import VerificationAlert from '../../unifiedFeeSystem/components/VerificationAlert';
import LookItemDetails from './LookItemDetails';
import LookSavePanel from './LookSavePanel';
import LookItems from './LookItems';
import LookTotalPrice from './LookTotalPrice';

const LookConfigureContainer: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const {
    classes: { emptyGrid },
  } = useOverviewStyles();
  const { isLoadingLook, lookSalesData, lookDetail } = useCurrentLook();
  const { translate } = useTranslation();
  const { settings } = useSettings();

  const theme = useTheme();
  const isXlScreen = useMediaQuery(theme.breakpoints.up('XXLarge'));

  const enableMakeupAssets = settings?.enableMakeupAssets;
  const router = useRouter();

  const [name, setName] = useState(lookDetail?.name || '');
  const [description, setDescription] = useState(lookDetail?.description || '');
  const [isSaveDisabled, setIsSaveDisabled] = useState(false);

  useEffect(() => {
    if (lookDetail) {
      setName(lookDetail.name || '');
      setDescription(lookDetail.description || '');
    }
  }, [lookDetail]);

  useEffect(() => {
    setIsSaveDisabled(!name?.trim());
  }, [name]);

  const handleReload = useCallback(() => {
    router.reload();
  }, [router]);

  if (isLoadingLook) {
    return (
      <Grid container className={emptyGrid} justifyContent='center' alignItems='center'>
        <CircularProgress />
      </Grid>
    );
  }

  if (!enableMakeupAssets || !lookDetail || !lookSalesData) {
    return (
      <FailureView
        title={translate('Heading.FailedToLoadPage')}
        message={translate('Message.FailedToLoadPage')}
        buttonText={translate('Action.FailedToLoadPage')}
        onReload={handleReload}
      />
    );
  }

  return (
    <div style={{ width: '100%', maxWidth: '1800px', paddingRight: isXlScreen ? '10%' : '0%' }}>
      <VerificationAlert />
      <LookItemDetails
        lookDetail={lookDetail}
        name={name}
        description={description}
        setName={setName}
        setDescription={setDescription}
      />
      <LookTotalPrice totalValue={lookDetail.totalValue ?? 0} />
      <LookItems items={lookDetail?.items || []} />
      <LookSavePanel
        isSaveDisabled={isSaveDisabled}
        lookId={lookDetail?.lookId ?? ''}
        name={name}
        description={description}
      />
    </div>
  );
};

export default withTranslation(LookConfigureContainer, [
  TranslationNamespace.Creations,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
  TranslationNamespace.ConfigureItem,
  TranslationNamespace.AssetTypes,
]);
