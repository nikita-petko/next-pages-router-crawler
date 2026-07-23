import React, { useState, FunctionComponent, useMemo, useContext } from 'react';
import { Grid, Button, Typography } from '@rbx/ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { Asset } from '@modules/miscellaneous/common';
import { useRouter } from 'next/router';
import { bytesPerMB } from '@modules/miscellaneous/common/components/uploaders/constants/size';
import Link from 'next/link';
import { getProductionCreatorHubUrl } from '@rbx/env-utils';
import useAssetCreationEntrywayStyles from './AssetCreationEntryway.styles';
import {
  allowedAssetTypeFormats,
  isCreateAssetAvailable,
  maxDurationInSeconds,
  maxFileSizeMB,
  maxResolution,
} from '../constants/AssetTypeConstants';
import createAssetFormContext from './providers/CreateAssetFormContext';

export interface AssetCreationEntrywayProps {
  assetType: Asset;
  containerHasData: () => boolean;
}

enum DraggedFileValidationError {
  None,
  AttachmentLimit,
  FileType,
  FileSize,
  DurationLimit,
  ResolutionLimit,
  Other,
}

const AssetCreationEntryway: FunctionComponent<
  React.PropsWithChildren<AssetCreationEntrywayProps>
> = (props) => {
  const {
    classes: {
      createAssetZone,
      createAssetZoneEmpty,
      createAssetZoneDragOver,
      createAssetZoneDragOverError,
      createAssetTextError,
    },

    cx,
  } = useAssetCreationEntrywayStyles();

  const { assetType, containerHasData } = props;

  const { updateDroppedFile } = useContext(createAssetFormContext);
  const [isUserDraggingFile, setIsUserDraggingFile] = useState<boolean>(false);
  const [draggedFileValidationStatus, setDraggedFileValidationStatus] =
    useState<DraggedFileValidationError>(DraggedFileValidationError.None);
  const { translate, translateHTML } = useTranslation();
  const router = useRouter();
  const maxFileSizeForAsset = maxFileSizeMB(assetType);
  const durationLimit = maxDurationInSeconds(assetType);
  const maxResolutionLimit = maxResolution(assetType);
  const maxNumberOfAttachments = 1;

  const redirectToCreateAssetForm = (type: Asset) => {
    let queryParams = `assetType=${type}`;
    const currentQueryParams = router.query;
    if (currentQueryParams?.groupId !== undefined) {
      queryParams += `&groupId=${currentQueryParams.groupId}`;
    }
    router.push(`/dashboard/creations/upload?${queryParams}`);
  };

  const validateDataTransferItems = (items: DataTransferItemList) => {
    if (items.length !== 1) {
      return DraggedFileValidationError.AttachmentLimit;
    }

    const item = items[0];

    if (item.kind !== 'file') {
      return DraggedFileValidationError.FileType;
    }

    const file = item.getAsFile();

    if (file != null && maxFileSizeForAsset && file.size > maxFileSizeForAsset * bytesPerMB) {
      return DraggedFileValidationError.FileSize;
    }

    return DraggedFileValidationError.None;
  };

  const handleCreateAssetFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsUserDraggingFile(false);

    const draggedFileValidation = validateDataTransferItems(e.dataTransfer.items);
    if (draggedFileValidation === DraggedFileValidationError.None) {
      setDraggedFileValidationStatus(DraggedFileValidationError.None);

      const file = e.dataTransfer.items[0].getAsFile();
      if (file != null) {
        const fileFormat = file.name.split('.').pop() ?? '';
        if (allowedAssetTypeFormats(assetType).includes(fileFormat)) {
          updateDroppedFile(file);
          redirectToCreateAssetForm(assetType);
        } else {
          const potentialTypes: Asset[] = [];
          Object.values(Asset).forEach((potentialType) => {
            const formats = allowedAssetTypeFormats(potentialType);
            if (formats.includes(fileFormat)) {
              potentialTypes.push(potentialType as Asset);
            }
          });

          if (potentialTypes.length > 0 && isCreateAssetAvailable(potentialTypes[0])) {
            updateDroppedFile(file);
            redirectToCreateAssetForm(potentialTypes[0]);
          }
          setDraggedFileValidationStatus(DraggedFileValidationError.FileType);
        }
      }
    } else {
      setDraggedFileValidationStatus(draggedFileValidation); // set to false since we want to display red for the file being too big.
    }
  };

  // used for both onDragEnter and onDragLeave
  const handleCreateAssetFileDragEdge = (isUserDragging: boolean) => {
    return (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsUserDraggingFile(isUserDragging);
    };
  };

  const handleCreateAssetFileDragOver = (isUserDragging: boolean) => {
    return (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsUserDraggingFile(isUserDragging);
    };
  };

  const getCreateAssetStyles = () => {
    const createAssetStyles: string[] = [];
    createAssetStyles.push(createAssetZone);

    if (!containerHasData()) {
      createAssetStyles.push(createAssetZoneEmpty);
    }

    if (draggedFileValidationStatus !== DraggedFileValidationError.None) {
      createAssetStyles.push(createAssetZoneDragOverError);
    }

    if (isUserDraggingFile && draggedFileValidationStatus) {
      createAssetStyles.push(createAssetZoneDragOver);
    }

    return cx(createAssetStyles);
  };

  const getAttachmentRequirementStyles = (targetError: DraggedFileValidationError) => {
    if (draggedFileValidationStatus === targetError) {
      return createAssetTextError;
    }
    return '';
  };

  const areaContent = useMemo(() => {
    if (isUserDraggingFile) {
      return <Typography variant='body2'>{translate('Message.ReleaseAsset')}</Typography>;
    }
    return [
      <Button
        key='createAssetZoneButton'
        size='medium'
        variant='contained'
        color='primary'
        onClick={() => redirectToCreateAssetForm(assetType)}>
        <span>{translate('Label.CreateAsset')}</span>
      </Button>,
      <Typography key='createAssetZoneDragAndDropText' variant='body2' color='disabled'>
        {translate('Message.DragAndDropAsset')}
      </Typography>,
      maxFileSizeForAsset !== null && assetType === Asset.Video && (
        <Typography key='createAssetZoneUseAssetManagerInStudio' variant='body2' color='disabled'>
          {translateHTML(
            'Label.UseAssetManagerInStudio',
            [
              {
                opening: 'aStart',
                closing: 'aEnd',
                content(chunks) {
                  return (
                    <Link
                      href={`${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/ui/video-frames#upload`}
                      target='_blank'
                      style={{ textDecoration: 'none' }}>
                      {chunks}
                    </Link>
                  );
                },
              },
            ],
            { byteLimit: '3.75GB' },
          )}
        </Typography>
      ),
      <Typography
        key='createAssetZoneAttachmentLimitText'
        variant='subtitle2'
        className={getAttachmentRequirementStyles(DraggedFileValidationError.AttachmentLimit)}>
        {translate('Message.AttachmentLimit', {
          maxNumberOfAttachments: maxNumberOfAttachments?.toString() ?? '',
        })}
      </Typography>,
      <Typography
        key='createAssetZoneFileTypeText'
        variant='subtitle2'
        className={getAttachmentRequirementStyles(DraggedFileValidationError.FileType)}>
        {`${translate('Label.Format')} ${allowedAssetTypeFormats(assetType)
          ?.map((type) => `*.${type}`)
          .join(', ')}`}
      </Typography>,
      maxFileSizeForAsset !== null && (
        <Typography
          key='createAssetZoneAttachmentSizeText'
          variant='subtitle2'
          className={getAttachmentRequirementStyles(DraggedFileValidationError.FileSize)}>
          {translate('Message.AttachmentSizeLimit', {
            maxAttachmentSize: maxFileSizeForAsset?.toString() ?? '',
          })}
        </Typography>
      ),
      durationLimit !== null && (
        <Typography key='createAssetZoneAttachmentDurationLimit' variant='subtitle2'>
          {durationLimit > 60 && durationLimit % 60 === 0
            ? translate('Message.DurationLimitMinutesText', {
                maxDurationMinutes: (durationLimit / 60).toString() ?? '',
              })
            : translate('Message.DurationLimitText', {
                maxDuration: durationLimit.toString() ?? '',
              })}
        </Typography>
      ),
      maxResolutionLimit !== null && (
        <Typography key='createAssetZoneAttachmentResolutionLimit' variant='subtitle2'>
          {translate('Message.MaxResolutionLimitText', {
            maxResolution: maxResolutionLimit ?? '',
          })}
        </Typography>
      ),
    ];
    // NOTE (jcountryman, 2/6/24): Turned off to check in @rbx/ui upgrade. Codeowners is
    // responsible for triaging issue.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- explanation is above
  }, [isUserDraggingFile, translate, assetType, draggedFileValidationStatus]);

  return (
    <Grid
      item
      container
      wrap='nowrap'
      direction='column'
      className={getCreateAssetStyles()}
      onDrop={handleCreateAssetFileDrop}
      onDragEnter={handleCreateAssetFileDragEdge(true)}
      onDragOver={handleCreateAssetFileDragOver(true)}
      onDragLeave={handleCreateAssetFileDragEdge(false)}
      alignItems='center'
      justifyContent='center'
      data-testid='create-asset-zone'>
      {areaContent}
    </Grid>
  );
};

export default withTranslation(AssetCreationEntryway, [
  TranslationNamespace.ConfigureItem,
  TranslationNamespace.GenreType,
  TranslationNamespace.AssetTypes,
  TranslationNamespace.AssetUpload,
  TranslationNamespace.Error,
]);
