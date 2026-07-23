import { Icon, IconButton } from '@rbx/foundation-ui';
import { Tooltip } from '@rbx/ui';
import { KeyboardEvent, MouseEvent, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import useCreativesStyles from '@components/campaignBuilder/common/creative/Creatives.styles';
import Creative from '@components/common/Creative';
import { FormField } from '@constants/campaignBuilder';
import { TranslationNamespace } from '@constants/localization';
import type { FormType } from '@hooks/campaignBuilder/baseFormSchema';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { CaptureException } from '@utils/error';

const CreativeLogo = ({
  adEnabled,
  adRejected,
  assetId,
  existing,
}: {
  adEnabled: boolean;
  adRejected: boolean;
  assetId: number;
  existing: boolean;
}) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const logos = useWatch<FormType, typeof FormField.LOGO_ASSETS>({
    name: FormField.LOGO_ASSETS,
  });
  const { setValue } = useFormContext<FormType>();
  const {
    classes: {
      checkIconWrapper,
      creativeGlass,
      creativeUploadDrawerThumbnail,
      disabledCreativeGlass,
      lockIconWrapper,
      logoStyle,
      selectedCreativeGlass,
      trashIconWrapper,
    },
    cx,
  } = useCreativesStyles();
  // const flowType = useCampaignBuilderStore((state) => state.flowType);
  // const simplifiedCampaign = useCampaignBuilderStore((state) => state.simplifiedCampaign?.data);
  // const editMode = flowType === FlowTypes.EDIT;
  const [lockTooltipOpen, setLockTooltipOpen] = useState<boolean>(false);

  const index = logos.findIndex((logo) => logo.assetId === assetId);
  if (index === -1) {
    CaptureException(`Couldn't find logo with assetId: ${assetId}`);
    return null;
  }
  const { isSelected } = logos[index];
  // TODO: Check against actual LOGO_ASSETS_id field once it's added to SimplifiedCampaignType
  // const editingExistingLogo = editMode && simplifiedCampaign?.LOGO_ASSETS_id === assetId;
  const editingExistingLogo = false;
  const isDisabled = editingExistingLogo || existing;

  const onClickSelect = () => {
    // Deselect all other logos and select this one
    const updatedLogos = logos.map((logo, idx) => ({
      ...logo,
      isSelected: idx === index ? !logo.isSelected : false,
    }));

    setValue(FormField.LOGO_ASSETS, updatedLogos, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  const onClickTrash = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setValue(FormField.LOGO_ASSETS, [...logos.slice(0, index), ...logos.slice(index + 1)], {
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
    // Lock icon is only shown for existing (published) logos
    if (!existing) {
      return null;
    }
    return (
      <Tooltip
        onMouseOut={() => setLockTooltipOpen(false)}
        onMouseOver={() => setLockTooltipOpen(true)}
        placement='top'
        title={translate('Description.LogoCannotRemovePublished')}>
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
    // Trash icon is only shown for non-existing (unpublished) logos
    if (existing) {
      return null;
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
    // Shown for all non-disabled logos
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
      const selectedLogos = logos.filter((logo) => logo.isSelected);
      if (selectedLogos.length > 0) {
        return translate('Description.LogoDeselectFirst');
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
      tooltipTitle = translate('Description.LogoRejectedModeration');
    } else if (!adEnabled) {
      tooltipTitle = translate('Description.LogoDisabledServing');
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
        <Creative assetId={assetId} className={logoStyle} />
      </div>
    </Tooltip>
  );
};

export default CreativeLogo;
