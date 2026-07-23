import { Divider, Tooltip, TooltipTrigger } from '@rbx/foundation-ui';
import { useMemo } from 'react';
import { useWatch } from 'react-hook-form';

import AssetTileImage from '@components/campaignBuilder/common/creative/AssetTileImage';
import tileStyles from '@components/campaignBuilder/common/creative/CreativeImportTab.module.css';
import CreativeLockBadge from '@components/campaignBuilder/common/creative/CreativeLockBadge';
import { FOUNDATION_TOOLTIP_BODY_SMALL_CLASS } from '@components/common/creative/tooltipStyles';
import { FormField } from '@constants/campaignBuilder';
import { TranslationNamespace } from '@constants/localization';
import type { FormType } from '@hooks/campaignBuilder/baseFormSchema';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { countSelectedCreatives } from '@utils/campaignBuilder';

interface CreativeActiveTabProps {
  maxAllowedSelections: number;
}

// "Active" tab for the edit-campaign creative drawer. Read-only catalog of
// every existing thumbnail on the campaign — mirrors the legacy Published
// Thumbnails section where `existing` tiles cannot be toggled on/off. Every
// existing creative is locked here; per-ad serving (active vs. paused)
// awareness is being reworked in a follow-up PR, so this tab no longer reads
// the async, date-filtered ad list.
const CreativeActiveTab = ({ maxAllowedSelections }: CreativeActiveTabProps) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.CreativeLibrary);
  const { translate: translateCampaign } = useNamespacedTranslation(TranslationNamespace.Campaign);

  const creatives = useWatch<FormType, typeof FormField.THUMBNAILS>({
    name: FormField.THUMBNAILS,
  });

  const selectedCount = useMemo(() => countSelectedCreatives(creatives), [creatives]);

  const activeTiles = useMemo(
    () => (creatives ?? []).filter(({ existing }) => existing).map(({ assetId }) => ({ assetId })),
    [creatives],
  );

  const renderGrid = () => {
    if (activeTiles.length === 0) {
      return (
        <p className='text-body-medium content-muted margin-[0px]'>
          {translate('Description.NoActiveCreatives')}
        </p>
      );
    }

    return (
      <div className={`${tileStyles.tileGrid} grid gap-large`} data-testid='active-tile-grid'>
        {activeTiles.map(({ assetId }) => {
          const tooltipTitle = translateCampaign('Description.CreativeCannotRemovePublished');
          const tile = (
            <div
              aria-label={translate('Label.Image')}
              className='width-full relative radius-medium'
              data-asset-id={assetId}
              data-testid='active-tile'>
              <AssetTileImage
                alt={translate('Label.Image')}
                assetId={assetId}
                containerClassName='opacity-[0.4]'
              />
              <CreativeLockBadge />
            </div>
          );

          return (
            <div key={assetId}>
              <Tooltip
                contentClassName={FOUNDATION_TOOLTIP_BODY_SMALL_CLASS}
                position='top-center'
                title={tooltipTitle}>
                <TooltipTrigger asChild>
                  <span className='flex width-full'>{tile}</span>
                </TooltipTrigger>
              </Tooltip>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className='flex flex-col gap-large'>
      <p className='margin-[0px] text-body-medium content-default'>
        {translate('Description.ActiveCreativesHelper')}
      </p>

      <div className='flex flex-col width-full'>
        <div className='flex items-center justify-between padding-y-medium gap-medium width-full'>
          <p className='text-label-medium content-emphasis margin-[0px]'>
            {translate('Label.MediaWithCount', {
              max: String(maxAllowedSelections),
              selected: String(selectedCount),
            })}
          </p>
        </div>
        <Divider />
        <div className='padding-top-medium'>{renderGrid()}</div>
      </div>
    </div>
  );
};

export default CreativeActiveTab;
