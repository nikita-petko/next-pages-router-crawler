import { useState, useCallback, useEffect } from 'react';
import { SearchCreatorType } from '@rbx/client-universes-api/v1';
import { useTranslation } from '@rbx/intl';
import { Typography, Grid, IconButton, DeleteOutlinedIcon, Divider, Switch } from '@rbx/ui';
import type { ScopeInfo } from '@modules/clients/cloudAuthentication';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import { WildcardTargetPart } from '../constants/openCloudConstants';
import TargetPartNames from '../enums/TargetPartNames';
import useScopeFormState from '../hooks/useScopeFormState';
import useScopeSystem from '../hooks/useScopeSystem';
import useConfirmationDialog from '../hooks/v1/useConfirmationDialog';
import {
  buildDeleteApiSystemDialogControls,
  buildToggleWildcardsSystemDialogControls,
} from '../utils/dialogControlBuilders';
import useProductFormStyles from './ProductForm.styles';
import SingleLevelOperationsForm from './SingleLevelOperationsForm';
import TargetPartSearch from './v1/TargetPartSearch';

interface ProductFormProps {
  className: string;
  productName: string;
  compact: boolean;
  onChange?: (scopeTypeName: string, scopeInfos: ScopeInfo[]) => void; // need to specify the scope type too so parent can properly update the merged list
  onDelete?: () => void; // parent delete handler
  setIsDirty?: () => void; // isDirty handler to track user I/O events
  creatorType: SearchCreatorType;
  creatorTargetId?: number;
  staleUniverseIds?: Set<string>;
}

const ProductForm = ({
  className,
  productName,
  compact,
  creatorType,
  creatorTargetId,
  onDelete,
  setIsDirty,
  staleUniverseIds,
}: ProductFormProps) => {
  const { settings, isFetched } = useSettings();
  const {
    classes: { divider, firstScopeTargetSubLevel, searchDropdown },
  } = useProductFormStyles();

  const {
    openDialog: openDeleteDialog,
    BuildDialogBody: BuildDeleteDialogBody,
    buildDialogBodyProps: buildDeleteDialogBodyProps,
    ConfirmDialog: DeleteConfirmDialog,
    partialConfirmDialogProps: partialDeleteConfirmDialogProps,
  } = useConfirmationDialog(onDelete);

  const {
    getAllTargetValuesAtPath,
    removeTargetFromProduct,
    getResource,
    getAllSelectedOperationsAtPath,
  } = useScopeFormState();
  const { getNthSharedTargetPart } = useScopeSystem();
  const { translate } = useTranslation();
  const firstTargetPartName = getNthSharedTargetPart(productName, 0);
  const [firstTargets, setFirstTargets] = useState<string[]>(() => {
    const targets = getAllTargetValuesAtPath(productName);
    if (
      targets.length === 0 &&
      isFetched &&
      settings?.enableTargetPartWildcards &&
      creatorType === SearchCreatorType.User
    ) {
      return [WildcardTargetPart];
    }
    return targets;
  });

  const [selectScopesPerResource, setSelectScopesPerResource] = useState(true);
  const [enableWildcards, setEnableWildcards] = useState(() => {
    return (
      creatorType === SearchCreatorType.User &&
      (firstTargets.length === 0 || firstTargets.includes(WildcardTargetPart))
    );
  });

  const handleToggleWildcards = useCallback(() => {
    setEnableWildcards((prev) => !prev);
    setFirstTargets((prevSelectedTargets) => {
      if (prevSelectedTargets.includes(WildcardTargetPart)) {
        removeTargetFromProduct(productName, WildcardTargetPart);
        return [];
      }
      prevSelectedTargets.forEach((targetPart) => {
        removeTargetFromProduct(productName, targetPart);
      });
      return [WildcardTargetPart];
    });
    setIsDirty?.();
  }, [productName, removeTargetFromProduct, setIsDirty]);

  const {
    openDialog: openWildcardsDialog,
    BuildDialogBody: BuildWildcardsDialogBody,
    buildDialogBodyProps: buildWildcardsDialogBodyProps,
    ConfirmDialog: WildcardsConfirmDialog,
    partialConfirmDialogProps: partialWildcardsConfirmDialogProps,
  } = useConfirmationDialog(handleToggleWildcards);

  useEffect(() => {
    if (firstTargets.length <= 1) {
      setSelectScopesPerResource(false);
      return;
    }

    const targetOperations = firstTargets.map((target) => {
      const operations = getAllSelectedOperationsAtPath(productName, target);
      return operations
        .map((op) => `${op.scopeTypeName}:${op.operation}`)
        .sort()
        .join(',');
    });
    const firstTargetOps = targetOperations[0];
    const allTargetsHaveSameOperations = targetOperations.every((ops) => ops === firstTargetOps);

    setSelectScopesPerResource(!allTargetsHaveSameOperations);
  }, [firstTargets, productName, getAllSelectedOperationsAtPath]);

  // populate the first targets array on mount information if the target part name is special (undefined or creator)
  useEffect(() => {
    const getCreatorTargetValue = async () => {
      if (firstTargets.length === 0) {
        const creator = await getResource(firstTargetPartName);
        const creatorString = creator?.value;
        if (creatorString !== undefined) {
          setFirstTargets([creatorString]);
        }
      }
    };
    // if TargetType is not provided by the scope
    if (firstTargetPartName === (TargetPartNames.Undefined as string)) {
      setFirstTargets([WildcardTargetPart]);
    } else if (firstTargetPartName === (TargetPartNames.Creator as string)) {
      // Only auto-select creator for group API keys
      if (creatorType === SearchCreatorType.Group) {
        void getCreatorTargetValue();
      }
    }
  }, [firstTargetPartName, firstTargets.length, getResource, creatorType]);

  const openDeleteConfirmDialog = useCallback(() => {
    openDeleteDialog(buildDeleteApiSystemDialogControls(productName, translate));
  }, [openDeleteDialog, productName, translate]);

  const openToggleWildcardsConfirmDialog = useCallback(() => {
    const isCreatorTargetPart = firstTargetPartName === (TargetPartNames.Creator as string);
    openWildcardsDialog(buildToggleWildcardsSystemDialogControls(translate, isCreatorTargetPart));
  }, [openWildcardsDialog, translate, firstTargetPartName]);

  const onSelectExperience = useCallback(
    (experienceIdString: string) => {
      if (experienceIdString !== '') {
        if (!firstTargets.includes(experienceIdString)) {
          setFirstTargets((prevFirstTargets) => {
            return [experienceIdString].concat(prevFirstTargets);
          });

          setIsDirty?.();
        }
      }
    },
    [firstTargets, setIsDirty],
  );

  const onSelectCreator = useCallback(
    (creatorId: string) => {
      if (creatorId !== '') {
        if (!firstTargets.includes(creatorId)) {
          setFirstTargets((prevFirstTargets) => {
            return [creatorId].concat(prevFirstTargets);
          });

          setIsDirty?.();
        }
      }
    },
    [firstTargets, setIsDirty],
  );

  const handleOnDeleteTargetPart = useCallback(
    (selectedFirstTargetPartIndex: number | undefined) => {
      const selectedFirstTargetPartIndexCopy = selectedFirstTargetPartIndex ?? 0;

      setFirstTargets((prevFirstTargets) => {
        removeTargetFromProduct(productName, prevFirstTargets[selectedFirstTargetPartIndexCopy]);
        const newTargetPartsCpy = [...prevFirstTargets];
        newTargetPartsCpy.splice(selectedFirstTargetPartIndexCopy, 1);
        return newTargetPartsCpy;
      });
      setIsDirty?.();
    },
    [productName, removeTargetFromProduct, setIsDirty],
  );

  return (
    <div className={className}>
      <Grid item container alignItems='center' justifyContent='space-between'>
        <Grid item container alignItems='center' Medium={5}>
          <Typography variant='h4'>{productName}</Typography>
          <IconButton
            aria-label={translate('Heading.RemoveAPISystem')}
            size='small'
            color='secondary'
            onClick={openDeleteConfirmDialog}>
            <DeleteOutlinedIcon />
          </IconButton>
        </Grid>
        {firstTargetPartName !== (TargetPartNames.Creator as string) &&
          firstTargetPartName !== (TargetPartNames.Undefined as string) && (
            <Grid
              item
              container
              alignItems='center'
              justifyContent={compact ? 'flex-start' : 'flex-end'}
              Medium={7}>
              {isFetched &&
                settings?.enableTargetPartWildcards &&
                creatorType === SearchCreatorType.User && (
                  <>
                    <Grid item>
                      <Switch
                        id='restrict-to-specific-universes'
                        aria-label='Restrict by Experience'
                        checked={!enableWildcards}
                        onChange={() => {
                          openToggleWildcardsConfirmDialog();
                        }}
                      />
                    </Grid>
                    <Grid item>
                      <Typography variant='body2' style={{ marginRight: '10px' }}>
                        {translate('Message.RestrictToSpecificUniverses') ||
                          'Restrict by Experience'}
                      </Typography>
                    </Grid>
                  </>
                )}
              {(!enableWildcards || !settings?.enableTargetPartWildcards) && (
                <TargetPartSearch
                  targetPartName={firstTargetPartName}
                  creatorType={creatorType}
                  creatorTargetId={creatorTargetId}
                  onChange={onSelectExperience}
                  className={searchDropdown}
                  selectedIds={firstTargets}
                />
              )}
            </Grid>
          )}
        {firstTargetPartName === (TargetPartNames.Creator as string) &&
          creatorType === SearchCreatorType.User && (
            <Grid
              item
              container
              alignItems='center'
              justifyContent={compact ? 'flex-start' : 'flex-end'}
              Medium={7}>
              {isFetched && settings?.enableTargetPartWildcards && (
                <>
                  <Grid item>
                    <Switch
                      id='restrict-to-specific-creators'
                      aria-label='Restrict by Creator'
                      checked={!enableWildcards}
                      onChange={() => {
                        openToggleWildcardsConfirmDialog();
                      }}
                    />
                  </Grid>
                  <Grid item>
                    <Typography variant='body2' style={{ marginRight: '10px' }}>
                      {translate('Message.RestrictToSpecificCreators')}
                    </Typography>
                  </Grid>
                </>
              )}
              {(!enableWildcards || !settings?.enableTargetPartWildcards) && (
                <TargetPartSearch
                  targetPartName={TargetPartNames.Creator}
                  creatorType={creatorType}
                  creatorTargetId={creatorTargetId}
                  onChange={onSelectCreator}
                  className={searchDropdown}
                  selectedIds={firstTargets}
                />
              )}
            </Grid>
          )}
      </Grid>
      <Divider className={divider} />
      {firstTargetPartName === (TargetPartNames.Universe as string) && firstTargets.length > 1 && (
        <>
          <Switch
            id='api-key-select-per-resource'
            aria-label='Select Scopes Per Resource'
            disabled={firstTargets.length <= 1}
            checked={selectScopesPerResource}
            onChange={(_, checked) => {
              setSelectScopesPerResource(checked);
              setIsDirty?.();
            }}
          />
          <Typography variant='body1'>{translate('Message.SelectScopesPerResource')}</Typography>
        </>
      )}
      {(() => {
        if (selectScopesPerResource) {
          return (
            <>
              {firstTargets.length > 0 ? (
                firstTargets.map((target, idx) => (
                  <SingleLevelOperationsForm
                    className={firstScopeTargetSubLevel}
                    key={target}
                    productName={productName}
                    targetPartValues={[target]}
                    onDelete={() => handleOnDeleteTargetPart(idx)}
                    setIsDirty={setIsDirty}
                    staleUniverseIds={staleUniverseIds}
                  />
                ))
              ) : (
                <>
                  <br />
                  <Typography color='primary' variant='body1'>
                    {translate('Message.NoTargetPartsAdded')}
                  </Typography>
                </>
              )}
            </>
          );
        }
        return (
          <>
            {firstTargets.length > 0 ? (
              <SingleLevelOperationsForm
                className={firstScopeTargetSubLevel}
                productName={productName}
                targetPartValues={firstTargets}
                onDelete={handleOnDeleteTargetPart}
                setIsDirty={setIsDirty}
                staleUniverseIds={staleUniverseIds}
              />
            ) : (
              <Typography color='primary' variant='body1'>
                {translate(
                  firstTargetPartName === (TargetPartNames.Creator as string)
                    ? 'Message.NoCreatorsAdded'
                    : 'Message.NoTargetPartsAdded',
                )}
              </Typography>
            )}
          </>
        );
      })()}
      <DeleteConfirmDialog
        {...partialDeleteConfirmDialogProps}
        content={<BuildDeleteDialogBody {...buildDeleteDialogBodyProps} />}
      />
      <WildcardsConfirmDialog
        {...partialWildcardsConfirmDialogProps}
        content={<BuildWildcardsDialogBody {...buildWildcardsDialogBodyProps} />}
      />
    </div>
  );
};
export default ProductForm;
