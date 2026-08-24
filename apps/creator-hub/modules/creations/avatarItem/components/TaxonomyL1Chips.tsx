import type { FunctionComponent } from 'react';
import React, { useCallback } from 'react';
import { Chip } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { makeStyles } from '@rbx/ui';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import useAvatarLooksGate from '../../home/hooks/useAvatarLooksGate';
import useUGCFoldersGate from '../../home/hooks/useUGCFoldersGate';
import useTaxonomySelection from '../hooks/useTaxonomySelection';
import { taxonomyOptionLabel } from '../utils/taxonomyCategoriesUtils';
import {
  ALL_ASSET_TYPES_L1_KEY,
  AVATAR_LOOKS_L1_KEY,
  buildTaxonomyActiveTab,
  isAllAssetTypesActiveTab,
  isAvatarLooksActiveTab,
} from '../utils/taxonomyRoutingUtils';

const useStyles = makeStyles()({
  chipRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    // The chips are a labelled group of toggle buttons, so the element is a fieldset; strip the
    // border and inset padding a fieldset carries by default.
    border: 'none',
    margin: 0,
    padding: 0,
    minInlineSize: 'auto',
  },
});

/**
 * Top-level taxonomy categories, rendered inline with the Avatar Items toolbar controls. Selection
 * lives in the `activeTab` query param so it is shareable and survives navigation.
 */
const TaxonomyL1Chips: FunctionComponent = () => {
  const {
    classes: { chipRow },
  } = useStyles();
  const { translate } = useTranslation();
  const isUGCFoldersEnabled = useUGCFoldersGate();
  const isAvatarLooksEnabled = useAvatarLooksGate() ?? false;
  const [{ activeTab }, setActiveTabParams] = useQueryParams(['activeTab', 'filterIndex']);
  // Shared with the grid so the chips and the listing can never disagree about which L1 is active.
  const { l1Options, activeL1Key } = useTaxonomySelection(true);

  const isAllTab = isAllAssetTypesActiveTab(activeTab);
  const isAvatarLooksTab = isAvatarLooksActiveTab(activeTab);

  const handleSelect = useCallback(
    (taxonomyKey?: string) => {
      if (!taxonomyKey) {
        return;
      }
      setActiveTabParams({ activeTab: buildTaxonomyActiveTab(taxonomyKey), filterIndex: 0 });
    },
    [setActiveTabParams],
  );

  // "All Asset Types" is folder-backed rather than a taxonomy category. It still lives in the
  // taxonomy activeTab namespace so the chip row stays on screen and the tab remains reachable.
  const handleSelectAll = useCallback(() => {
    setActiveTabParams({
      activeTab: buildTaxonomyActiveTab(ALL_ASSET_TYPES_L1_KEY),
      filterIndex: 0,
    });
  }, [setActiveTabParams]);

  // Avatar looks have no taxonomy category, but they stay in this namespace so selecting them keeps
  // the category view rather than dropping back to the item-type one.
  const handleSelectAvatarLooks = useCallback(() => {
    setActiveTabParams({
      activeTab: buildTaxonomyActiveTab(AVATAR_LOOKS_L1_KEY),
      filterIndex: 0,
    });
  }, [setActiveTabParams]);

  const categoriesLabel = translate('Label.Categories');

  // Categories are still loading or failed to load. Hiding the row is fine for a category tab, but on
  // All Asset Types — which does not need the taxonomy tree — it would leave the page with no
  // sub-navigation at all, since this row replaces the item-type submenu in taxonomy mode.
  if (l1Options.length === 0 && !isAllTab) {
    return null;
  }

  // Chip announces its state through `aria-pressed`, so these are labelled toggle buttons in a
  // group rather than a tablist: `aria-selected` is not valid on a button that is already pressed.
  return (
    <fieldset className={chipRow} aria-label={categoriesLabel}>
      {/* First, as in the item-type submenu. */}
      {isAvatarLooksEnabled && (
        <Chip
          text={translate('Label.Avatars')}
          size='Medium'
          variant='Standard'
          isChecked={isAvatarLooksTab}
          onCheckedChange={handleSelectAvatarLooks}
        />
      )}
      {l1Options.map((option) => (
        <Chip
          key={option.taxonomyKey ?? option.nameKey}
          text={taxonomyOptionLabel(option, translate)}
          size='Medium'
          variant='Standard'
          isChecked={option.taxonomyKey === activeL1Key}
          onCheckedChange={() => handleSelect(option.taxonomyKey)}
        />
      ))}
      {/* Folder-backed, so it follows the folders flag exactly as the item-type submenu does. */}
      {isUGCFoldersEnabled && (
        <Chip
          text={translate('Label.AllAssetTypes')}
          size='Medium'
          variant='Standard'
          isChecked={isAllTab}
          onCheckedChange={handleSelectAll}
        />
      )}
    </fieldset>
  );
};

export default TaxonomyL1Chips;
