import React, { FunctionComponent, useState, useCallback, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogContentText,
  Button,
  IconButton,
  CloseIcon,
  makeStyles,
  useSnackbar,
  ChevronRightIcon,
} from '@rbx/ui';
import { Checkbox } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Asset, assetFullNameKeys, toastDurationTime } from '@modules/miscellaneous/common';
import { Flex } from '@modules/miscellaneous/common/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { itemconfigurationClient, tryParseResponseError } from '@modules/clients';
import { RobloxItemConfigurationApiModelsRequestCollectiblesBulkUpdateTargetsAssetTypeEnum } from '@rbx/client-itemconfiguration/v1';
import { uuidService } from '@rbx/core';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import getTranslationKeyForItemConfigurationError from '../../unifiedFeeSystem/helper/ItemConfigurationErrorHelper';
import { translateAssetType } from '../../unifiedFeeSystem/helper/UnifiedFeeSystemHelper';

const useStyles = makeStyles()((theme) => ({
  dialogPaper: {
    minWidth: 376,
    maxWidth: 480,
  },
  dialogContent: {
    padding: theme.spacing(3),
  },
  dialogTitle: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dialogTitleText: {
    flex: 1,
    minWidth: 0,
  },
  closeButton: {
    marginLeft: 'auto',
  },
  descriptionText: {
    marginBottom: theme.spacing(2),
    color: theme.palette.content.standard,
  },
  checkboxList: {
    gap: theme.spacing(0.5),
    marginBottom: theme.spacing(2),
    '& .text-title-small': {
      font: 'var(--typography-body-medium-font)',
      letterSpacing: 'var(--typography-body-medium-letter-spacing)',
    },
  },
  categoryRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    minHeight: 40,
  },
  expandToggle: {
    padding: theme.spacing(0.5),
    '& svg': {
      transition: theme.transitions.create('transform', { duration: 150 }),
    },
  },
  expandToggleCollapsed: {
    transform: 'rotate(90deg)',
  },
  expandToggleExpanded: {
    transform: 'rotate(-90deg)',
  },
  subtypeIndent: {
    paddingLeft: theme.spacing(8),
    gap: theme.spacing(0.5),
    flexDirection: 'column',
    display: 'flex',
    paddingBottom: theme.spacing(1),
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: theme.spacing(2),
    width: '100%',
  },
  actionButton: {
    flex: 1,
  },
  bulletList: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(2),
    paddingLeft: theme.spacing(3),
    color: theme.palette.content.standard,
  },
  categoryLabelWide: {
    flex: 1,
    minWidth: 0,
  },
}));

export interface TimedOptionsAllBulkUpdateCategoryFlags {
  showClothing: boolean;
  showMakeup: boolean;
  showAccessories: boolean;
  /** When false, only parent category checkboxes and no dropdowns (intermediate state: original clothing + all makeup).
   *  TODO @mryumae: Remove this flag once timed options has been launched for makeup and remaining asset types.
   */
  showCategorySubtypeDropdowns?: boolean;
}

export interface TimedOptionsAllBulkUpdateAssetTypesByCategory {
  clothing: Asset[];
  makeup: Asset[];
  accessories: Asset[];
}

export interface TimedOptionsAllBulkUpdateProps {
  open: boolean;
  onClose: () => void;
  categoryFlags: TimedOptionsAllBulkUpdateCategoryFlags;
  /** Asset types per category; parent passes lists already intersected with rentable permissions. */
  assetTypesByCategory?: TimedOptionsAllBulkUpdateAssetTypesByCategory;
}

type CategoryKey = keyof TimedOptionsAllBulkUpdateAssetTypesByCategory;

/** New full UI: (makeup, clothing, accessories). */
const CATEGORY_ORDER_WITH_SUBTYPE_DROPDOWNS: CategoryKey[] = ['makeup', 'clothing', 'accessories'];

/** Legacy two-row UI: original clothing first, then makeup. */
const CATEGORY_ORDER_LEGACY_COMPACT: CategoryKey[] = ['clothing', 'makeup'];

/** Creations namespace: parent row uses `all`, confirm partial line uses `short` (e.g. "Makeup (Eyes, …)"). */
const CATEGORY_TRANSLATION_KEYS: Record<CategoryKey, { all: string; short: string }> = {
  makeup: { all: 'Label.AllMakeup', short: 'Label.Makeup' },
  clothing: { all: 'Label.AllClothing', short: 'Label.Clothing' },
  accessories: { all: 'Label.AllAccessories', short: 'Label.Accessories' },
};

function clothingCategoryAllLabelKey(showCategorySubtypeDropdowns: boolean): string {
  return showCategorySubtypeDropdowns
    ? CATEGORY_TRANSLATION_KEYS.clothing.all
    : 'Label.ClothingOnlyTShirtsPantsSweaters';
}

const TimedOptionsAllBulkUpdate: FunctionComponent<TimedOptionsAllBulkUpdateProps> = ({
  open,
  onClose,
  categoryFlags,
  assetTypesByCategory,
}) => {
  const { translate } = useTranslation();
  const { classes, cx } = useStyles();
  const { enqueue, close } = useSnackbar();
  const currentGroup = useCurrentGroup();
  const showCategorySubtypeDropdowns = categoryFlags.showCategorySubtypeDropdowns !== false;
  const categoryOrder = useMemo(
    (): CategoryKey[] =>
      showCategorySubtypeDropdowns
        ? CATEGORY_ORDER_WITH_SUBTYPE_DROPDOWNS
        : CATEGORY_ORDER_LEGACY_COMPACT,
    [showCategorySubtypeDropdowns],
  );
  const [expanded, setExpanded] = useState<Record<CategoryKey, boolean>>({
    clothing: false,
    makeup: false,
    accessories: false,
  });
  const [assetSelection, setAssetSelection] = useState<Record<Asset, boolean>>(
    {} as Record<Asset, boolean>,
  );
  /** Parent row checked state when that category has zero subtype rows (all default on). */
  const [emptyCategoryParentChecked, setEmptyCategoryParentChecked] = useState<
    Record<CategoryKey, boolean>
  >(() => ({
    clothing: true,
    makeup: true,
    accessories: true,
  }));
  const [showConfirmationStep, setShowConfirmationStep] = useState(false);
  const [confirmMode, setConfirmMode] = useState<'enable' | 'disable' | null>(null);

  const displayAssetsByCategory = useMemo(() => {
    if (!assetTypesByCategory) {
      return {
        clothing: [] as Asset[],
        makeup: [] as Asset[],
        accessories: [] as Asset[],
      };
    }
    return {
      clothing: assetTypesByCategory.clothing,
      makeup: assetTypesByCategory.makeup,
      accessories: assetTypesByCategory.accessories,
    };
  }, [assetTypesByCategory]);

  const showCategory = useMemo(
    (): Record<CategoryKey, boolean> => ({
      clothing: categoryFlags.showClothing,
      makeup: categoryFlags.showMakeup,
      accessories: categoryFlags.showAccessories,
    }),
    [categoryFlags.showAccessories, categoryFlags.showClothing, categoryFlags.showMakeup],
  );

  useEffect(() => {
    if (open) {
      const initial: Record<Asset, boolean> = {} as Record<Asset, boolean>;
      if (assetTypesByCategory) {
        const { clothing, makeup, accessories } = assetTypesByCategory;
        [...clothing, ...makeup, ...accessories].forEach((a) => {
          initial[a] = true;
        });
      }
      setAssetSelection(initial);
      setEmptyCategoryParentChecked({
        clothing: true,
        makeup: true,
        accessories: true,
      });
      setExpanded({ clothing: false, makeup: false, accessories: false });
      setShowConfirmationStep(false);
      setConfirmMode(null);
    }
  }, [open, assetTypesByCategory]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleEnableSelectedClick = useCallback(() => {
    setConfirmMode('enable');
    setShowConfirmationStep(true);
  }, []);

  const handleDisableSelectedClick = useCallback(() => {
    setConfirmMode('disable');
    setShowConfirmationStep(true);
  }, []);

  const getParentCheckState = (categoryKey: CategoryKey, assets: Asset[]) => {
    if (assets.length === 0) {
      return emptyCategoryParentChecked[categoryKey];
    }
    const isChecked = (a: Asset) => assetSelection[a] !== false;
    const anyChecked = assets.some(isChecked);
    const allChecked = assets.every(isChecked);
    if (!anyChecked) {
      return false;
    }
    if (allChecked) {
      return true;
    }
    return 'indeterminate';
  };

  const handleParentCategoryCheckedChange =
    (categoryKey: CategoryKey, assets: Asset[]) => (checked: boolean | 'indeterminate') => {
      if (assets.length === 0) {
        setEmptyCategoryParentChecked((prev) => ({ ...prev, [categoryKey]: checked === true }));
        return;
      }
      setAssetSelection((prev) => {
        const next = { ...prev };
        assets.forEach((a) => {
          next[a] = checked === true;
        });
        return next;
      });
    };

  const handleChildCheckedChange = (asset: Asset) => (checked: boolean | 'indeterminate') => {
    setAssetSelection((prev) => ({ ...prev, [asset]: checked === true }));
  };

  const handleConfirmationConfirm = useCallback(async () => {
    if (!assetTypesByCategory || confirmMode === null) {
      onClose();
      return;
    }

    const selectedAssets = categoryOrder.flatMap((key) => {
      if (!showCategory[key]) {
        return [];
      }
      return displayAssetsByCategory[key].filter((asset) => assetSelection[asset] !== false);
    });

    const toIds = (assets: Asset[]) =>
      assets.map(
        (asset) =>
          translateAssetType(
            asset,
          ) as RobloxItemConfigurationApiModelsRequestCollectiblesBulkUpdateTargetsAssetTypeEnum,
      );

    try {
      await itemconfigurationClient.bulkUpdateCollectible(
        uuidService.generateRandomUuid(),
        currentGroup?.id,
        toIds(selectedAssets),
        confirmMode === 'enable',
      );
      enqueue({
        message: translate('Message.TimedOptionSettingsApplied'),
        anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
        autoHideDuration: toastDurationTime,
        autoHide: true,
        onClose: close,
      });
      window.location.reload();
      onClose();
    } catch (e) {
      const error = await tryParseResponseError(e);
      const errorTranslationKey = getTranslationKeyForItemConfigurationError(
        error,
        'Error.Unknown',
      );
      enqueue({
        message: translate(errorTranslationKey),
        anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
        autoHideDuration: toastDurationTime,
        autoHide: true,
        onClose: close,
      });
    }
  }, [
    assetTypesByCategory,
    assetSelection,
    confirmMode,
    currentGroup?.id,
    enqueue,
    close,
    onClose,
    displayAssetsByCategory,
    showCategory,
    translate,
    categoryOrder,
  ]);

  const handleConfirmationCancel = useCallback(() => {
    setShowConfirmationStep(false);
    setConfirmMode(null);
  }, []);

  /** One bullet per category when visible, with rows, and at least one selected: "All …" or "Category (subtypes)". */
  const confirmationCategorySummaryLines = useMemo(() => {
    const summaryLineForCategory = (key: CategoryKey): string | null => {
      if (!showCategory[key]) {
        return null;
      }
      const displayed = displayAssetsByCategory[key];
      if (displayed.length === 0) {
        return null;
      }
      const selected = displayed.filter((a) => assetSelection[a] !== false);
      if (selected.length === 0) {
        return null;
      }
      if (selected.length === displayed.length) {
        const allKey =
          key === 'clothing'
            ? clothingCategoryAllLabelKey(showCategorySubtypeDropdowns)
            : CATEGORY_TRANSLATION_KEYS[key].all;
        return translate(allKey);
      }
      const categoryShort = translate(CATEGORY_TRANSLATION_KEYS[key].short);
      const subtypeList = selected.map((a) => translate(assetFullNameKeys[a])).join(', ');
      return `${categoryShort} (${subtypeList})`;
    };

    return categoryOrder
      .map(summaryLineForCategory)
      .filter((line): line is string => line !== null);
  }, [
    assetSelection,
    displayAssetsByCategory,
    showCategory,
    showCategorySubtypeDropdowns,
    translate,
    categoryOrder,
  ]);

  const hasAnyCheckboxSelected = useMemo(
    () =>
      categoryOrder.some(
        (key) =>
          showCategory[key] &&
          displayAssetsByCategory[key].some((a) => assetSelection[a] !== false),
      ),
    [assetSelection, displayAssetsByCategory, showCategory, categoryOrder],
  );

  const renderCategoryBlock = (categoryKey: CategoryKey) => {
    const assets = displayAssetsByCategory[categoryKey];
    if (!showCategory[categoryKey]) {
      return null;
    }
    const isExpanded = expanded[categoryKey];
    const panelId = `timed-options-bulk-${categoryKey}-subtypes`;
    const categoryAllKey =
      categoryKey === 'clothing'
        ? clothingCategoryAllLabelKey(showCategorySubtypeDropdowns)
        : CATEGORY_TRANSLATION_KEYS[categoryKey].all;
    const categoryLabel = translate(categoryAllKey);

    return (
      <React.Fragment key={categoryKey}>
        <div className={classes.categoryRow}>
          {showCategorySubtypeDropdowns ? (
            <IconButton
              type='button'
              size='small'
              className={classes.expandToggle}
              onClick={() =>
                setExpanded((prev) => ({ ...prev, [categoryKey]: !prev[categoryKey] }))
              }
              aria-expanded={isExpanded}
              aria-controls={panelId}
              aria-label={translate('AriaLabel.ToggleTimedOptionsCategorySubtypes', {
                categoryName: categoryLabel,
              })}
              color='inherit'>
              <ChevronRightIcon
                className={cx(
                  isExpanded ? classes.expandToggleExpanded : classes.expandToggleCollapsed,
                )}
              />
            </IconButton>
          ) : null}
          <Checkbox
            label={categoryLabel}
            size='Small'
            placement='Start'
            isChecked={getParentCheckState(categoryKey, assets)}
            onCheckedChange={handleParentCategoryCheckedChange(categoryKey, assets)}
            className={classes.categoryLabelWide}
          />
        </div>
        {showCategorySubtypeDropdowns && isExpanded ? (
          <div id={panelId} className={classes.subtypeIndent}>
            {assets.map((asset) => (
              <Checkbox
                key={asset}
                label={translate(assetFullNameKeys[asset])}
                size='Small'
                placement='Start'
                isChecked={assetSelection[asset] !== false}
                onCheckedChange={handleChildCheckedChange(asset)}
              />
            ))}
          </div>
        ) : null}
      </React.Fragment>
    );
  };

  const renderConfirmationStepContent = (introKey: string, categoryLines: string[]) => (
    <React.Fragment>
      <DialogContentText className={classes.descriptionText}>
        {translate(introKey)}
      </DialogContentText>
      {categoryLines.length > 0 && (
        <ul className={classes.bulletList}>
          {categoryLines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
      <DialogContentText className={classes.descriptionText}>
        {translate('Description.ThisWillAlsoReplaceAnyItemLevelSettings')}
      </DialogContentText>
      <Flex flexDirection='row' classes={{ root: classes.buttonContainer }}>
        <Button
          variant='contained'
          color='primaryBrand'
          onClick={handleConfirmationConfirm}
          size='medium'
          className={classes.actionButton}>
          {translate('Action.Confirm')}
        </Button>
        <Button
          variant='contained'
          color='secondary'
          onClick={handleConfirmationCancel}
          size='medium'
          className={classes.actionButton}>
          {translate('Action.Cancel')}
        </Button>
      </Flex>
    </React.Fragment>
  );

  const checkboxStepContent = (
    <React.Fragment>
      <DialogContentText className={classes.descriptionText}>
        {translate('Description.BulkUpdateAllTimedOptions')}
      </DialogContentText>
      <Flex flexDirection='column' classes={{ root: classes.checkboxList }}>
        {categoryOrder.map((key) => renderCategoryBlock(key))}
      </Flex>
      <Flex flexDirection='row' classes={{ root: classes.buttonContainer }}>
        <Button
          variant='contained'
          color='secondary'
          onClick={handleEnableSelectedClick}
          size='medium'
          className={classes.actionButton}
          disabled={!hasAnyCheckboxSelected}>
          {translate('Action.Enable')}
        </Button>
        <Button
          variant='contained'
          color='secondary'
          onClick={handleDisableSelectedClick}
          size='medium'
          className={classes.actionButton}
          disabled={!hasAnyCheckboxSelected}>
          {translate('Action.Disable')}
        </Button>
      </Flex>
    </React.Fragment>
  );

  let dialogBodyContent = checkboxStepContent;
  if (showConfirmationStep) {
    dialogBodyContent = renderConfirmationStepContent(
      confirmMode === 'enable'
        ? 'Description.ThisWillEnableTimedOptionsFor'
        : 'Description.ThisWillDisableTimedOptionsFor',
      confirmationCategorySummaryLines,
    );
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth='Small'
      color='primaryBrand'
      classes={{ paper: classes.dialogPaper }}>
      <DialogTitle className={classes.dialogTitle}>
        <span className={classes.dialogTitleText}>
          {showConfirmationStep
            ? translate('Title.ConfirmOption')
            : translate('Action.TimedOptions')}
        </span>
        {!showConfirmationStep && (
          <IconButton
            aria-label='Close'
            onClick={handleClose}
            size='small'
            className={classes.closeButton}
            color='inherit'>
            <CloseIcon />
          </IconButton>
        )}
      </DialogTitle>
      <DialogContent className={classes.dialogContent}>{dialogBodyContent}</DialogContent>
    </Dialog>
  );
};

export default withTranslation(TimedOptionsAllBulkUpdate, [
  TranslationNamespace.ConfigureItem,
  TranslationNamespace.Creations,
  TranslationNamespace.AssetTypes,
]);
