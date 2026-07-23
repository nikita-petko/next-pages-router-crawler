import React, { FunctionComponent, useEffect } from 'react';
import { withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useRouter } from 'next/router';
import { Asset } from '@modules/miscellaneous/common';
import { ErrorPage } from '@modules/miscellaneous/error';
import { StatusCodes } from '@rbx/core';
import CreateAssetForm from './CreateAssetForm';
import { isCreateAssetAvailable } from '../constants/AssetTypeConstants';

const CreateAssetContainer: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const router = useRouter();
  let assetType = Asset[router.query.assetType as keyof typeof Asset];

  useEffect(() => {
    // Codeowner is responsible for fixing errors.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- (jcountryman, 04/17/24): Disabled to check in settings deletion
    assetType = Asset[router.query.assetType as keyof typeof Asset];
    if (assetType === undefined) {
      router.push(`/dashboard/creations`);
    }
  });

  if (isCreateAssetAvailable(assetType)) {
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
