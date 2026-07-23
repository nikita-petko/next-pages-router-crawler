import { Icon, IconButton } from '@rbx/foundation-ui';
import { Tooltip } from '@rbx/ui';
import { KeyboardEvent, MouseEvent, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import useCreativesStyles from '@components/campaignBuilder/common/creative/Creatives.styles';
import Creative from '@components/common/Creative';
import { AssetSource, FlowTypes, FormField } from '@constants/campaignBuilder';
import { TranslationNamespace } from '@constants/localization';
import type { FormType } from '@hooks/campaignBuilder/baseFormSchema';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { useCampaignBuilderStore } from '@stores/campaignBuilderStoreProvider';
import { CaptureException } from '@utils/error';

const CreativeThumbnail = ({
  adEnabled,
  adRejected,
  assetId,
  assetSource,
  existing,
  maxAllowedCreatives,
}: {
  adEnabled: boolean;
  adRejected: boolean;
  assetId: number;
  assetSource: AssetSource;
  existing: boolean;
  maxAllowedCreatives: number;
}) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const { translate: translateReport } = useNamespacedTranslation(TranslationNamespace.Report);
  const creatives = useWatch<FormType, typeof FormField.THUMBNAILS>({
    name: FormField.THUMBNAILS,
  });
  const { setValue } = useFormContext<FormType>();
  const {
    classes: {
      checkIconWrapper,
      creativeGlass,
      creativeUploadDrawerThumbnail,
      disabledCreativeGlass,
      disabledTrashIconWrapper,
      lockIconWrapper,
      selectedCreativeGlass,
      thumbnailStyle,
      trashIconWrapper,
    },
    cx,
  } = useCreativesStyles();
  const flowType = useCampaignBuilderStore((state) => state.flowType);
  const simplifiedCampaign = useCampaignBuilderStore((state) => state.simplifiedCampaign?.data);
  const editMode = flowType === FlowTypes.EDIT;
  const [lockTooltipOpen, setLockTooltipOpen] = useState<boolean>(false);

  const index = creatives.findIndex((creative) => creative.assetId === assetId);
  if (index === -1) {
    CaptureException(`Couldn't find creative with assetId: ${assetId}`);
    return null;
  }
  const selectedCreatives = creatives.filter(({ isSelected }) => isSelected).length;
  const { isSelected } = creatives[index];
  const tooManyCreativesSelected = selectedCreatives >= maxAllowedCreatives && !isSelected;
  const editingExistingThumbnail = editMode && simplifiedCampaign?.asset_ids?.includes(assetId);
  const isDisabled = tooManyCreativesSelected || editingExistingThumbnail || existing;

  const onClickSelect = () => {
    setValue(
      FormField.THUMBNAILS,
      [
        ...creatives.slice(0, index),
        { ...creatives[index], isSelected: !creatives[index].isSelected },
        ...creatives.slice(index + 1),
      ],
      { shouldDirty: true, shouldTouch: true, shouldValidate: true },
    );
  };

  const onClickTrash = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setValue(FormField.THUMBNAILS, [...creatives.slice(0, index), ...creatives.slice(index + 1)], {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  const onKeyDownSelect = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClickSelect();
    }
  };

  const maybeRenderLockIcon = () => {
    // Lock icon is only shown for existing (published) thumbnails
    // It is shown on all published thumbnails, regardless of whether they are active or disabled
    if (!existing) {
      return null;
    }
    return (
      <Tooltip
        onMouseOut={() => setLockTooltipOpen(false)}
        onMouseOver={() => setLockTooltipOpen(true)}
        placement='top'
        title={translate('Description.CreativeCannotRemovePublished')}>
        <Icon
          aria-label={translate('Description.LockIcon')}
          className={lockIconWrapper}
          name='icon-regular-lock-closed'
          size='Small'
        />
      </Tooltip>
    );
  };

  const maybeRenderTrashIcon = () => {
    // Trash icon is only shown for non-existing (unpublished) thumbnails
    // It is disabled for thumbnails imported from Creator Hub
    // It is enabled for thumbnails uploaded in Ads Manager
    if (existing) {
      return null;
    }
    if (assetSource === AssetSource.CREATOR) {
      return (
        <Tooltip placement='top' title={translate('Description.ImportedThumbnailCannotDelete')}>
          <Icon
            aria-label={translate('Description.LockIcon')}
            className={disabledTrashIconWrapper}
            name='icon-regular-trash-can'
            size='Small'
          />
        </Tooltip>
      );
    }
    return (
      <IconButton
        ariaLabel={translate('Description.DeleteIcon')}
        className={trashIconWrapper}
        icon='icon-regular-trash-can'
        onClick={onClickTrash}
        size='Small'
        variant='Utility'
      />
    );
  };

  const maybeRenderSelectIcon = () => {
    // Shown for all non-disabled thumbnails
    if (isDisabled) {
      return null;
    }
    return isSelected ? (
      <Icon
        aria-label={translate('Description.SelectIcon')}
        className={checkIconWrapper}
        name='icon-filled-circle-check'
        size='Small'
      />
    ) : (
      <Icon
        aria-label={translate('Description.SelectIcon')}
        className={checkIconWrapper}
        name='icon-regular-circle-check'
        size='Small'
      />
    );
  };

  const getTooltipTitle = () => {
    if (!isSelected) {
      if (selectedCreatives >= maxAllowedCreatives) {
        return translate('Description.MaxThumbnailReached');
      }
    }
    return '';
  };

  const renderButtonImage = () => (
    <div
      className={cx(creativeGlass, {
        [disabledCreativeGlass]: isDisabled,
        [selectedCreativeGlass]: isSelected,
      })}
      onClick={onClickSelect}
      onKeyDown={onKeyDownSelect}
      role='button'
      tabIndex={0}>
      {maybeRenderLockIcon()}
      {maybeRenderTrashIcon()}
      {maybeRenderSelectIcon()}
    </div>
  );

  const renderDisabledImage = () => {
    let tooltipTitle = '';
    if (lockTooltipOpen) {
      tooltipTitle = '';
    } else if (adRejected) {
      tooltipTitle = translate('Description.ThumbnailRejectedModeration');
    } else if (!adEnabled) {
      tooltipTitle = translateReport('Status.Paused');
    }

    return (
      <Tooltip placement='top' title={tooltipTitle}>
        <div
          className={cx(creativeGlass, {
            [disabledCreativeGlass]: isDisabled,
            [selectedCreativeGlass]: isSelected && !adRejected && adEnabled,
          })}
          color='inherit'>
          {maybeRenderLockIcon()}
          {maybeRenderTrashIcon()}
          {maybeRenderSelectIcon()}
        </div>
      </Tooltip>
    );
  };

  return (
    <Tooltip placement='top' title={getTooltipTitle()}>
      <div className={creativeUploadDrawerThumbnail}>
        {isDisabled ? renderDisabledImage() : renderButtonImage()}
        <Creative assetId={assetId} className={thumbnailStyle} />
      </div>
    </Tooltip>
  );
};

export default CreativeThumbnail;
