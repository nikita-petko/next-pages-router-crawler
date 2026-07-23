import type { FunctionComponent } from 'react';
import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { StatusCodes } from '@rbx/core';
import { withTranslation } from '@rbx/intl';
import { Asset } from '@modules/miscellaneous/common';
import { PageLoading } from '@modules/miscellaneous/components';
import { ErrorPage } from '@modules/miscellaneous/error';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import { isCreateAssetAvailable } from '../constants/AssetTypeConstants';
import CreateAssetForm from './CreateAssetForm';

const CreateAssetContainer: FunctionComponent<React.PropsWithChildren> = () => {
  const router = useRouter();
  const { settings, isFetched } = useSettings();
  const assetType = Object.values(Asset).find((value) => value === router.query.assetType);

  useEffect(() => {
    // Codeowner is responsible for fixing errors.
    if (assetType === undefined) {
      void router.push(`/dashboard/creations`);
    }
  });

  // Avatar Background uploads are gated behind the enableAvatarBackgrounds setting.
  // Wait for settings before deciding, to avoid flashing a 404 while they load.
  if (assetType === Asset.AvatarBackground) {
    if (!isFetched) {
      return <PageLoading />;
    }
    if (!settings.enableAvatarBackgrounds) {
      return <ErrorPage errorCode={StatusCodes.NOT_FOUND} />;
    }
  }

  if (assetType !== undefined && isCreateAssetAvailable(assetType)) {
    return <CreateAssetForm assetType={assetType} />;
  }
  return <ErrorPage errorCode={StatusCodes.NOT_FOUND} />;
};

export default withTranslation(CreateAssetContainer, [
  TranslationNamespace.ConfigureItem,
  TranslationNamespace.GenreType,
  TranslationNamespace.AssetTypes,
  TranslationNamespace.AssetUpload,
  TranslationNamespace.Error,
  TranslationNamespace.Creations,
]);
