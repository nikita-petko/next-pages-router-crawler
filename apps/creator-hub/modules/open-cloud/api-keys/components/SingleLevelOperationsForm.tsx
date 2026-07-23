import { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from '@rbx/intl';
import {
  Grid,
  DeleteOutlinedIcon,
  FileCopyOutlinedIcon,
  Paper,
  Typography,
  OpenInNewIcon,
  WarningIcon,
} from '@rbx/ui';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import useSnackbar from '../../common/hooks/useSnackbar';
import { WildcardTargetPart } from '../constants/openCloudConstants';
import TargetPartNames from '../enums/TargetPartNames';
import useScopeFormState from '../hooks/useScopeFormState';
import useScopeSystem from '../hooks/useScopeSystem';
import useConfirmationDialog from '../hooks/v1/useConfirmationDialog';
import type OperationSelectOption from '../interfaces/OperationSelectOption';
import { buildDeleteTargetDialogControls } from '../utils/dialogControlBuilders';
import getLabelTranslationKeys from '../utils/productConfigurationUtils';
import IconButtonWithTooltip from './IconButtonWithTooltip';
import MultiSelectAutocomplete from './MultiSelectAutocomplete';
import SecondLevelOperationsForm from './SecondLevelOperationsForm';
import useSingleLevelOperationsFormStyles from './SingleLevelOperationsForm.styles';

interface SingleLevelOperationsFormProps {
  className: string;
  productName: string;
  targetPartValues?: string[];
  onDelete?: (targetPartValue?: number) => void;
  setIsDirty?: () => void;
  staleUniverseIds?: Set<string>;
}

const SingleLevelOperationsForm = ({
  productName,
  targetPartValues,
  onDelete,
  setIsDirty,
  className,
  staleUniverseIds,
}: SingleLevelOperationsFormProps) => {
  const {
    classes: { copyTargetPartButton, targetValueHeader, experienceNameListItem },
  } = useSingleLevelOperationsFormStyles();

  const { translate } = useTranslation();
  const { translateTargetPartName, getNthSharedTargetPart, getTargetTypeLength } = useScopeSystem();
  const { getResource, getAllSelectedOperationsAtPath } = useScopeFormState();
  const { showSnackbar } = useSnackbar();
  const currentGroup = useCurrentGroup();
  const [targetValuesFriendlyString, setTargetValuesFriendlyString] = useState<string[]>(
    targetPartValues ?? [],
  );
  const [targetPartToDelete, setTargetPartToDelete] = useState<number | undefined>();

  const {
    currentTargetPartName,
    translatedTargetPartName,
    nextTargetPartName,
    labelConfiguration,
  } = useMemo(() => {
    // build metadata object for all values related to the scope configuration
    const targetPartName = getNthSharedTargetPart(productName, 0);
    const nextTargetPart = getNthSharedTargetPart(productName, 1);
    const { firstLevelFormLabelKey } = getLabelTranslationKeys(productName);
    return {
      currentTargetPartName: targetPartName,
      translatedTargetPartName: translateTargetPartName(targetPartName),
      nextTargetPartName: nextTargetPart,
      labelConfiguration: { firstLevelFormLabelKey },
    };
  }, [getNthSharedTargetPart, translateTargetPartName, productName]);

  const onDeleteConfirm = useCallback(() => {
    setIsDirty?.();
    onDelete?.(targetPartToDelete);
    setTargetPartToDelete(undefined);
  }, [setIsDirty, onDelete, targetPartToDelete]);

  const onDeleteCancel = useCallback(() => {
    setTargetPartToDelete(undefined);
  }, []);

  const {
    openDialog: openConfirmDialog,
    BuildDialogBody: BuildConfirmDialogBody,
    buildDialogBodyProps: buildConfirmDialogBodyProps,
    ConfirmDialog: ConfirmDeleteDialog,
    partialConfirmDialogProps: partialConfirmDeleteDialogProps,
  } = useConfirmationDialog(onDeleteConfirm, onDeleteCancel);

  const openDeleteConfirmDialog = useCallback(
    (index: number) => (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      setTargetPartToDelete(index);
      const isCreatorTargetPart = currentTargetPartName === (TargetPartNames.Creator as string);
      openConfirmDialog(
        buildDeleteTargetDialogControls(
          translatedTargetPartName,
          targetValuesFriendlyString[index],
          translate,
          isCreatorTargetPart,
        ),
      );
    },
    [
      openConfirmDialog,
      translatedTargetPartName,
      translate,
      targetValuesFriendlyString,
      currentTargetPartName,
    ],
  );

  const copyToClipboard = useCallback(
    (index: number) => (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      void navigator.clipboard.writeText(targetPartValues?.[index] ?? '');
      showSnackbar(
        'success',
        '',
        translate('Message.CopyTargetPartValueSuccess', {
          targetPartName: translatedTargetPartName.toLocaleLowerCase(),
        }),
      );
    },
    [translatedTargetPartName, showSnackbar, targetPartValues, translate],
  );

  // util to filter out scope types that do not have multiple target parts (i.e. only return datastores)
  const getScopeOperationsWithMultipleTargetParts = useCallback(
    (operations: OperationSelectOption[]) => {
      return operations.filter(({ scopeTypeName }) => getTargetTypeLength(scopeTypeName) >= 2);
    },
    [getTargetTypeLength],
  );

  // operations stored for the next level of the form- filter out target types that do not have a second target part
  const [selectedDataStoreOperations, setSelectedDataStoreOperations] = useState<
    Array<OperationSelectOption>
  >(() =>
    getScopeOperationsWithMultipleTargetParts(
      getAllSelectedOperationsAtPath(productName, targetPartValues?.[0] ?? ''),
    ),
  );

  const onOperationsSelected = useCallback(
    (operations: OperationSelectOption[]) => {
      setSelectedDataStoreOperations(getScopeOperationsWithMultipleTargetParts(operations));
    },
    [getScopeOperationsWithMultipleTargetParts],
  );

  useEffect(() => {
    if (targetPartValues?.includes(WildcardTargetPart)) {
      setTargetValuesFriendlyString(targetPartValues);
      return;
    }

    const getTargetPartFriendlyString = async () => {
      if (!targetPartValues || targetPartValues.length === 0) {
        setTargetValuesFriendlyString([]);
        return;
      }

      try {
        const friendlyNames = await Promise.all(
          targetPartValues.map(async (targetPartValue) => {
            const cacheMetadata = await getResource(currentTargetPartName, targetPartValue);
            return cacheMetadata?.name ?? targetPartValue;
          }),
        );

        setTargetValuesFriendlyString(friendlyNames);
      } catch {
        setTargetValuesFriendlyString(targetPartValues);
      }
    };
    void getTargetPartFriendlyString();
  }, [currentTargetPartName, getResource, targetPartValues]);

  // build the form label based on the form label configuration object
  // Use different key when restrict by creator is toggled on (creators are selected, not wildcard)
  let targetLabel = null;
  if (labelConfiguration.firstLevelFormLabelKey !== undefined) {
    const isRestrictByCreatorOn =
      currentTargetPartName === (TargetPartNames.Creator as string) &&
      targetPartValues &&
      targetPartValues.length > 0 &&
      !targetPartValues.includes(WildcardTargetPart);
    const translationKey = isRestrictByCreatorOn
      ? 'Message.SelectAllAssetsForCreators'
      : labelConfiguration.firstLevelFormLabelKey;
    targetLabel = (
      <Typography color='primary' variant='body1' component='p'>
        {translate(translationKey)}
      </Typography>
    );
  }

  function renderIconButtons(idx: number) {
    // Don't show buttons on group API key pages for creator targets
    if (
      currentTargetPartName === (TargetPartNames.Creator as string) &&
      currentGroup !== null &&
      currentGroup !== undefined
    ) {
      return null;
    }
    const currentTargetPartValue = targetPartValues?.[idx];
    const isStaleUniverse =
      currentTargetPartName === (TargetPartNames.Universe as string) &&
      currentTargetPartValue !== undefined &&
      staleUniverseIds?.has(currentTargetPartValue);
    return (
      <>
        {isStaleUniverse && (
          <IconButtonWithTooltip
            icon={<WarningIcon color='warning' />}
            tooltipMsg={translate(
              'Message.StaleUniverseScope' /* TranslationNamespace.OpenCloud */,
            )}
          />
        )}
        {currentTargetPartName === (TargetPartNames.Universe as string) && (
          <IconButtonWithTooltip
            className={copyTargetPartButton}
            icon={<FileCopyOutlinedIcon />}
            onClick={copyToClipboard(idx)}
            tooltipMsg={translate('Message.CopyTargetPartValue', {
              targetPartName: translatedTargetPartName.toLocaleLowerCase(),
            })}
          />
        )}
        <IconButtonWithTooltip
          icon={<DeleteOutlinedIcon />}
          onClick={openDeleteConfirmDialog(idx)}
          tooltipMsg={translate('Heading.RemoveTargetPart', {
            targetPart: translatedTargetPartName,
          })}
        />
        {currentTargetPartName === (TargetPartNames.Universe as string) && (
          <IconButtonWithTooltip
            icon={<OpenInNewIcon />}
            onClick={() => {
              window.open(`creations/experiences/${targetPartValues?.[idx]}/overview`);
            }}
            tooltipMsg={translate('Action.OpenInNewTab')}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className={className}>
        {currentTargetPartName !== (TargetPartNames.Undefined as string) &&
          !targetPartValues?.includes(WildcardTargetPart) && (
            <Paper className={targetValueHeader}>
              {targetValuesFriendlyString.length > 1 ? (
                <ul className={experienceNameListItem}>
                  {targetValuesFriendlyString.map((name, idx) => (
                    <li key={targetPartValues?.[idx] ?? idx}>
                      <Typography variant='h5' component='span'>
                        {name}
                        {renderIconButtons(idx)}
                      </Typography>
                    </li>
                  ))}
                </ul>
              ) : (
                targetValuesFriendlyString.length === 1 && (
                  <Typography variant='h5' component='span'>
                    {targetValuesFriendlyString[0]}
                    {renderIconButtons(0)}
                  </Typography>
                )
              )}
            </Paper>
          )}

        <Grid item container alignItems='baseline' justifyContent='space-between'>
          <Grid item container alignItems='baseline' justifyContent='space-between'>
            <Grid Large={6} Medium={12} XSmall={12} item>
              {targetLabel}
            </Grid>
            <Grid Large={6} Medium={12} XSmall={12} item>
              <MultiSelectAutocomplete
                productName={productName}
                fullTargetPartPaths={targetPartValues ?? []}
                setIsDirty={setIsDirty}
                currentTargetPartName={currentTargetPartName}
                onChange={onOperationsSelected}
                areChipsActive
              />
            </Grid>
          </Grid>
        </Grid>
        {nextTargetPartName !== '' &&
          !targetPartValues?.includes(WildcardTargetPart) &&
          targetPartValues?.map((targetPartValue, idx) => (
            <SecondLevelOperationsForm
              key={targetPartValue}
              productName={productName}
              targetPartName={nextTargetPartName}
              parentTargetPartValue={targetPartValue}
              parentTargetPartName={targetValuesFriendlyString[idx]}
              inheritedOperations={selectedDataStoreOperations}
              setIsDirty={setIsDirty}
            />
          ))}
      </div>
      <ConfirmDeleteDialog
        {...partialConfirmDeleteDialogProps}
        content={<BuildConfirmDialogBody {...buildConfirmDialogBodyProps} />}
      />
    </>
  );
};

export default SingleLevelOperationsForm;
