import { useState, useCallback, useMemo, Fragment, useRef } from 'react';
import { useTranslation } from '@rbx/intl';
import {
  Switch,
  Grid,
  Typography,
  InputLabel,
  Button,
  Divider,
  IconButton,
  DeleteOutlinedIcon,
  Paper,
} from '@rbx/ui';
import { EmptyGrid } from '@modules/miscellaneous/components';
import useScopeFormState from '../hooks/useScopeFormState';
import useScopeSystem from '../hooks/useScopeSystem';
import useConfirmationDialog from '../hooks/v1/useConfirmationDialog';
import type OperationSelectOption from '../interfaces/OperationSelectOption';
import { buildDeleteTargetDialogControls } from '../utils/dialogControlBuilders';
import { getTargetPartTranslations } from '../utils/targetPartConfigurationUtils';
import MultiSelectAutocomplete from './MultiSelectAutocomplete';
import useSecondLevelOperationsFormStyles from './SecondLevelOperationsForm.styles';
import TargetPartGrid from './TargetPartGrid';

interface SecondLevelOperationFormProps {
  productName: string;
  parentTargetPartValue: string;
  targetPartName: string;
  parentTargetPartName: string;
  inheritedOperations?: OperationSelectOption[];
  setIsDirty?: () => void; // isDirty handler to track user I/O events
}

const SecondLevelOperationsForm = ({
  parentTargetPartValue,
  targetPartName,
  parentTargetPartName,
  productName,
  inheritedOperations,
  setIsDirty,
}: SecondLevelOperationFormProps) => {
  const { translate } = useTranslation();
  const {
    classes: {
      spacing,
      formBody,
      targetValueLabel,
      formLabelHeading,
      addMoreBtn,
      addMoreBtnInnerSpan,
    },
  } = useSecondLevelOperationsFormStyles();
  const [indexToRemove, setIndexToRemove] = useState<number>();
  const [isLoading] = useState<boolean>(false);
  const [, setHasError] = useState<boolean>(false);
  const { removeTargetFromProduct, getAllTargetValuesAtPath } = useScopeFormState();

  const translationKeys = useMemo(
    () => getTargetPartTranslations(targetPartName),
    [targetPartName],
  );

  // if the form is in edit mode, don't make the network call when the 'show datastores' toggle opens
  const isEditMode = useMemo(
    () => getAllTargetValuesAtPath(productName, parentTargetPartValue).length !== 0,
    [getAllTargetValuesAtPath, parentTargetPartValue, productName],
  );
  const gridRef = useRef<HTMLDivElement>(null);
  const [showNextLevelTargets, setShowNextLevelTargets] = useState<boolean>(isEditMode);
  const [formattedTargetValues, setFormattedTargetValues] = useState<string[]>(
    getAllTargetValuesAtPath(productName, parentTargetPartValue),
  );
  const [addMoreBtnControls, setAddMoreBtnControls] = useState<{
    isDisabled: boolean;
    isOpen: boolean;
  }>({
    isDisabled: false,
    isOpen: false,
  });

  const { formatTargetValue, friendlyFormatTargetValue, translateTargetPartName } =
    useScopeSystem();

  // on dialog cancel
  const onDeleteCancel = useCallback(() => {
    setIndexToRemove(undefined);
  }, []);

  /**
   * on dialog confirm. Upon deleting a datastore:
   * 1. Remove the datastore from the state manager via the product it is associated with
   * 2. Remove the datastore from the local React form state
   * 3. Enable the 'add more datastores to list' button so the user can get back the datastore they deleted
   */
  const onDeleteConfirm = useCallback(() => {
    setIsDirty?.();
    setFormattedTargetValues((prevTargetValues) => {
      if (indexToRemove !== undefined) {
        removeTargetFromProduct(
          productName,
          [parentTargetPartValue, prevTargetValues[indexToRemove]].join(','),
        );
        const newTargetPartsCpy = [...prevTargetValues];
        newTargetPartsCpy.splice(indexToRemove, 1);
        return newTargetPartsCpy;
      }
      return prevTargetValues;
    });
    setAddMoreBtnControls((prevBtnControls) => {
      return {
        ...prevBtnControls,
        isDisabled: false,
      };
    });
  }, [setIsDirty, indexToRemove, removeTargetFromProduct, productName, parentTargetPartValue]);

  const {
    openDialog,
    BuildDialogBody,
    buildDialogBodyProps,
    ConfirmDialog,
    partialConfirmDialogProps,
  } = useConfirmationDialog(onDeleteConfirm, onDeleteCancel);

  /**
   * Specific datastore level operations toggle:
   * 1. Only load the datastores from the backend when the toggle isactive and the form is not in edit mode.
   * 2. The loadFirstTargets method will cache the initial network call and return the cached the response for subsequent times the toggle
   * is opened and closed (i.e. it will simply default to the current state).
   */
  const onChecked = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { checked } = e.target;
    setShowNextLevelTargets(checked);
  }, []);

  /**
   * Item Grid Container helpers defined below for adding, determining selection status, grid item width, and toggling the item grid
   */

  const onAddDatastore = useCallback(
    (datastoreName: string) => {
      setIsDirty?.();
      setFormattedTargetValues((prevFormattedTargetValues) => {
        return prevFormattedTargetValues.concat([formatTargetValue(datastoreName, targetPartName)]);
      });

      // if the toggle error state was active and the user adds a datastore via the grid, reset the error state
      setHasError(false);
    },
    [formatTargetValue, targetPartName, setIsDirty],
  );

  const isTargetSelected = useCallback(
    (targetPartValue: string) => {
      return formattedTargetValues.includes(formatTargetValue(targetPartValue, targetPartName));
    },
    [formatTargetValue, formattedTargetValues, targetPartName],
  );

  const toggleOnAddMoreTargets = useCallback(() => {
    setAddMoreBtnControls((prevControls) => {
      return {
        ...prevControls,
        isOpen: !prevControls.isOpen,
      };
    });
  }, []);

  const gridPageWidthGetter = useCallback(() => gridRef.current?.scrollWidth, []);

  let mainFormBody;
  if (showNextLevelTargets) {
    mainFormBody = (
      <>
        <Typography color='primary' variant='body1' component='div'>
          {translate('Label.SelectOperationsPerDatastore', {
            targetPart: translateTargetPartName(targetPartName),
          })}
        </Typography>
        {formattedTargetValues.length > 0 ? (
          formattedTargetValues.map((nextTargetValue, index) => (
            <Grid
              className={spacing}
              key={[parentTargetPartValue, nextTargetValue].join(',')}
              item
              container
              alignItems='center'>
              <Grid item XXLarge={2} Large={4} Medium={12}>
                <Typography variant='body1' className={targetValueLabel}>
                  {friendlyFormatTargetValue(nextTargetValue, targetPartName)}
                </Typography>
              </Grid>
              <Grid container XXLarge={4} Large={8} Medium={12} alignItems='center'>
                <Grid item XXLarge={11} Medium={11} Large={11}>
                  <MultiSelectAutocomplete
                    productName={productName}
                    fullTargetPartPaths={[[parentTargetPartValue, nextTargetValue].join(',')]}
                    inheritedOperations={inheritedOperations}
                    setIsDirty={setIsDirty}
                    currentTargetPartName={targetPartName}
                  />
                </Grid>
                <Grid item XXLarge={1} Medium={1} Large={1}>
                  <IconButton
                    aria-label={translate('Action.Delete')}
                    color='secondary'
                    onClick={() => {
                      openDialog(
                        buildDeleteTargetDialogControls(
                          translateTargetPartName(targetPartName),
                          friendlyFormatTargetValue(nextTargetValue, targetPartName),
                          translate,
                        ),
                      );
                      setIndexToRemove(index);
                    }}
                    size='large'>
                    <DeleteOutlinedIcon />
                  </IconButton>
                </Grid>
              </Grid>
            </Grid>
          ))
        ) : (
          <Paper className={spacing}>
            <EmptyGrid>
              <Typography variant='body1' color='primary'>
                {translate('Message.NoDatastoresSelectedWarning')}
              </Typography>
            </EmptyGrid>
          </Paper>
        )}
      </>
    );
  }

  return (
    <>
      <Divider className={spacing} />
      <div className={formBody}>
        <Grid className={formLabelHeading} container alignItems='center' spacing={1}>
          <Grid item>
            <Switch
              id='show-next-targets'
              aria-label={translate('Label.SelectOperations')}
              checked={showNextLevelTargets}
              onChange={onChecked}
            />
          </Grid>
          <Grid item>
            <InputLabel htmlFor='show-next-targets'>
              {translate('Label.SpecificDatastoreOperations', {
                experienceName: parentTargetPartName,
              })}
            </InputLabel>
          </Grid>
        </Grid>

        {mainFormBody}

        {showNextLevelTargets && (
          <Button
            className={addMoreBtn}
            size='small'
            onClick={
              addMoreBtnControls.isDisabled || isLoading ? undefined : toggleOnAddMoreTargets
            }>
            <Typography variant='body1'>+</Typography>
            <Typography className={addMoreBtnInnerSpan} variant='body1'>
              {translate(translationKeys?.gridKeys?.openGridPromptKey ?? 'Button.GenericAddToList')}
            </Typography>
          </Button>
        )}

        <Grid ref={gridRef}>
          {showNextLevelTargets && addMoreBtnControls.isOpen && (
            <TargetPartGrid
              parentTargetPartValue={parentTargetPartValue}
              gridPageWidthGetter={gridPageWidthGetter}
              targetPartName={targetPartName}
              onAddTargetValue={onAddDatastore}
              isTargetValueSelected={isTargetSelected}
            />
          )}
          <Divider />
        </Grid>
      </div>
      <ConfirmDialog
        {...partialConfirmDialogProps}
        content={<BuildDialogBody {...buildDialogBodyProps} />}
      />
    </>
  );
};

export default SecondLevelOperationsForm;
