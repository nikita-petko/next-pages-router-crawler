import {
  Badge,
  Icon,
  Menu,
  MenuItem,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@rbx/foundation-ui';
import { forwardRef, useState } from 'react';

import useCreativesStyles from '@components/campaignBuilder/common/creative/Creatives.styles';
import { AI_CREATE_ADD_CREATIVE_ICON, AI_CREATE_GENERATE_ICON } from '@constants/aiCreatives';
import { ThumbnailSize } from '@constants/campaignBuilder';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';

// The plus icon is a 24px (Large) glyph centered in the 160px add tile, so its
// left edge sits (tileWidth - iconWidth) / 2 from the tile's left. The menu
// drops below the tile and shifts right by this amount so its left edge lines
// up with the plus icon's left edge rather than the tile's left edge.
const PLUS_ICON_SIZE_PX = 24;
const MENU_ALIGN_OFFSET_PX = (ThumbnailSize.width - PLUS_ICON_SIZE_PX) / 2;
// Keep the menu consistently below the Add Creative tile (no upward overlap).
const MENU_SIDE_OFFSET_PX = 4;

interface ThumbnailCreativeAddButtonProps {
  hasError?: boolean;
  isDisabled?: boolean;
  onAddCreative: () => void;
  onAiGenerate: () => void;
  showAiGenerateMenuItem: boolean;
  showCreativeAddMenu: boolean;
  testId?: string;
}

interface TileTriggerProps {
  ariaLabel: string;
  className: string;
  isDisabled?: boolean;
  onClick?: () => void;
  testId: string;
}

// Native <button> shaped like the live creative tiles next to it (per
// `addThumbnailTile` in Creatives.styles.ts). The whole 160x90 surface
// is the click target so the affordance matches the AssetTileImage
// tiles. forwardRef so Foundation's PopoverTrigger can attach the
// floating-ui ref when this trigger backs the AI menu.
const TileTrigger = forwardRef<HTMLButtonElement, TileTriggerProps>(
  ({ ariaLabel, className, isDisabled, onClick, testId, ...rest }, ref) => (
    <button
      aria-label={ariaLabel}
      className={className}
      data-testid={testId}
      disabled={isDisabled}
      onClick={onClick}
      ref={ref}
      type='button'
      {...rest}>
      <Icon name='icon-regular-circle-plus' size='Large' />
    </button>
  ),
);
TileTrigger.displayName = 'TileTrigger';

// Two-mode add affordance for campaign creatives:
//   - `showCreativeAddMenu=false`: a single-action tile that opens the
//     upload drawer directly. This matches the bug-bash tile styling
//     introduced for the non-AI add button.
//   - `showCreativeAddMenu=true`: the same tile, wired as a Popover
//     trigger that offers "Add creative" + "AI generate" menu items.
// Both branches share the `addThumbnailTile` look so the affordance
// stays consistent regardless of whether the GenAI flag is on.
const ThumbnailCreativeAddButton = ({
  hasError = false,
  isDisabled = false,
  onAddCreative,
  onAiGenerate,
  showAiGenerateMenuItem,
  showCreativeAddMenu,
  testId = 'creative-upload-button',
}: ThumbnailCreativeAddButtonProps) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.CreativeLibrary);
  // `Label.Beta` is an existing live key in the Campaign namespace (reused from
  // the objective Beta badges); the CreativeLibrary namespace doesn't define it.
  const { translate: translateCampaign } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const {
    classes: { addThumbnailTile, addThumbnailTileError },
    cx,
  } = useCreativesStyles();
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  const tileClassName = cx(addThumbnailTile, { [addThumbnailTileError]: hasError });
  const ariaLabel = translate('Action.AddCreative');

  if (!showCreativeAddMenu) {
    return (
      <TileTrigger
        ariaLabel={ariaLabel}
        className={tileClassName}
        isDisabled={isDisabled}
        onClick={onAddCreative}
        testId={testId}
      />
    );
  }

  return (
    <Popover onOpenChange={setMenuOpen} open={menuOpen}>
      <PopoverTrigger asChild disabled={isDisabled}>
        <TileTrigger ariaLabel={ariaLabel} className={tileClassName} testId={testId} />
      </PopoverTrigger>
      <PopoverContent
        align='start'
        alignOffset={MENU_ALIGN_OFFSET_PX}
        ariaLabel={translate('Label.AddCreativeOptions')}
        side='bottom'
        sideOffset={MENU_SIDE_OFFSET_PX}>
        <Menu className='flex flex-col gap-xxsmall padding-small'>
          <MenuItem
            leading={<Icon name={AI_CREATE_ADD_CREATIVE_ICON} size='Medium' />}
            onSelect={() => {
              setMenuOpen(false);
              onAddCreative();
            }}
            title={translate('Action.AddCreative')}
            value='add-creative'
          />
          {showAiGenerateMenuItem ? (
            <MenuItem
              leading={<Icon name={AI_CREATE_GENERATE_ICON} size='Medium' />}
              onSelect={() => {
                setMenuOpen(false);
                onAiGenerate();
              }}
              title={translate('Action.AiGenerate')}
              trailing={<Badge label={translateCampaign('Label.Beta')} />}
              value='ai-generate'
            />
          ) : null}
        </Menu>
      </PopoverContent>
    </Popover>
  );
};

export default ThumbnailCreativeAddButton;
