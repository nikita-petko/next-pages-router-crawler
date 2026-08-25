import { useMemo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { Autocomplete, Chip, Grid, CheckIcon, Typography, TextField } from '@rbx/ui';
import useScopeFormState from '../hooks/useScopeFormState';
import useScopeSystem from '../hooks/useScopeSystem';
import type OperationSelectOption from '../interfaces/OperationSelectOption';
import serializeSelectOption from '../utils/serializeSelectOption';

interface MultiSelectAutocompleteProps {
  onChange?: (operations: Array<OperationSelectOption>) => void;
  setIsDirty?: () => void;
  inheritedOperations?: Array<OperationSelectOption>;
  productName: string;
  fullTargetPartPaths: string[];
  currentTargetPartName: string;
  areChipsActive?: boolean;
  className?: string;
}

const MultiSelectAutocomplete = ({
  className,
  inheritedOperations,
  productName,
  fullTargetPartPaths,
  currentTargetPartName,
  onChange,
  setIsDirty,
  areChipsActive = false,
}: MultiSelectAutocompleteProps) => {
  const { getStaticOperationOptionsByTarget, getScopeTypesByProduct } = useScopeSystem();

  const { translate } = useTranslation();

  const { getAllSelectedOperationsAtPaths, batchAddOrUpdateTargetPartNodesForTargetPartPaths } =
    useScopeFormState();
  const options: Array<OperationSelectOption> = useMemo(
    () => getStaticOperationOptionsByTarget(productName, currentTargetPartName),
    [getStaticOperationOptionsByTarget, productName, currentTargetPartName],
  );

  const isProductSingleScoped = useCallback((): boolean => {
    return getScopeTypesByProduct(productName).length === 1;
  }, [getScopeTypesByProduct, productName]);

  /**
   * user selected operations. Any inherited operations should be left out of this state list
   * this is because we need a way to differentiate between what options were selected
   * by the user, and what options were 'auto' selected by the system. Auto-selected system options
   * take precedence over user-selected options, meaning if a user previously selected an option
   * that became inherited in the next render cycle, it is no longer a user selected option.
   *
   * Secondly, inherited operations differing between render cycles should overwrite each other. For
   * example if an operation 'read' is inherited by a parent selector, when a new inherited list on
   * a subsequent render is 'write','delete', 'read' will no longer appear as a selected value
   */
  const [userSelectedOperations, setUserSelectedOperations] = useState<
    Array<OperationSelectOption>
  >(() => getAllSelectedOperationsAtPaths(productName, fullTargetPartPaths));

  const { isInherited } = useMemo(() => {
    // create a helper to use to determine whether an operation is part of the inherited list of operations
    // return the isInherited helper so set is not recreated on every function invocation
    // return isInherited in a memo so we can re-use the set instance across renders when inherited operations don't change
    const scopeOperationSet = new Set<string>(
      inheritedOperations?.map((option) => serializeSelectOption(option) ?? []),
    );
    return {
      isInherited: (option: OperationSelectOption) => {
        return scopeOperationSet.has(serializeSelectOption(option));
      },
    };
  }, [inheritedOperations]);

  // update the operations in the global form state context
  const updateScopeFormStateOperations = useCallback(
    (newOptions: Array<OperationSelectOption>) => {
      const mergeOperations = (selectedOperations: Array<OperationSelectOption>) => {
        /**
         * Create the beginning acumulator value with all the scope types under the product (operations set to empty).
         * we need to create an empty operation state for each scope type so the new operations per target branch
         * are properly updated across all scope types within the state manager (i.e. if someone removes all operations
         * to a scope, this needs to be captured)
         */
        const initialOperationValues = getScopeTypesByProduct(productName).reduce<{
          [scopeTypeName: string]: {
            scopeTypeName: string;
            operations: string[];
          };
        }>((accumulator, nextScopeType) => {
          accumulator[nextScopeType] = {
            scopeTypeName: nextScopeType,
            operations: [],
          };
          return accumulator;
        }, {});

        return Object.values(
          selectedOperations.reduce<{
            [scopeTypeName: string]: {
              scopeTypeName: string;
              operations: string[];
            };
          }>((accumulator, next) => {
            const { scopeTypeName, operation } = next;
            accumulator[scopeTypeName].operations.push(operation);
            return accumulator;
          }, initialOperationValues),
        );
      };
      batchAddOrUpdateTargetPartNodesForTargetPartPaths(
        fullTargetPartPaths,
        mergeOperations(newOptions),
      );
    },
    [
      batchAddOrUpdateTargetPartNodesForTargetPartPaths,
      fullTargetPartPaths,
      getScopeTypesByProduct,
      productName,
    ],
  );

  useEffect(() => {
    setUserSelectedOperations((prevOperations) => {
      /**
       * filter out newly inherited operations (this is because onChange is the only other state-triggering
       * event that updates the operations- and that only happens when the user clicks something in the listbox-
       * for inherited operations changing at the parent level, we need to trigger a state change that re-filters
       * the user-selected operations list based on the new inherited values- mainly if any user selected values
       * should now be treated as inherited ones, we should remove them from the operations state
       */
      const newUserSelectedOperations = prevOperations.filter((option) => !isInherited(option));
      const newInheritedOps = inheritedOperations ?? [];
      const mergedOptions = [...newUserSelectedOperations, ...newInheritedOps];
      updateScopeFormStateOperations(mergedOptions);
      return newUserSelectedOperations;
    });
  }, [inheritedOperations, isInherited, updateScopeFormStateOperations]);

  // merged values of user selected and inherited operations
  const mergedOperations: Array<OperationSelectOption> = useMemo(() => {
    if (inheritedOperations) {
      return [...inheritedOperations, ...userSelectedOperations];
    }
    return userSelectedOperations;
  }, [inheritedOperations, userSelectedOperations]);

  const renderSelectedChips = (
    scopeOperations: Array<OperationSelectOption>,
    getTagProps: ({ index }: { index: number }) => object,
  ) => {
    return scopeOperations.map((scopeOperation, index) => {
      return (
        <Chip
          key={serializeSelectOption(scopeOperation) + String(index).toString()}
          variant={isInherited(scopeOperation) || areChipsActive ? 'filled' : 'outlined'}
          color='primary'
          label={`${scopeOperation.scopeTypeName}:${scopeOperation.operation}`}
          {...getTagProps({ index })}
          disabled={isInherited(scopeOperation)}
          onClick={(e) => {
            if (!isInherited(scopeOperation)) {
              e.stopPropagation();
              window.open(
                `/docs/cloud/reference/scopes#${scopeOperation.scopeTypeName}:${scopeOperation.operation}`,
                '_blank',
              );
            }
          }}
        />
      );
    });
  };

  const onChangeAndMergeHandler = useCallback(
    (_: React.ChangeEvent<object>, newOptions: Array<OperationSelectOption>) => {
      // filter out inherited values from the user-selected operations array
      setUserSelectedOperations(newOptions.filter((option) => !isInherited(option)));
      updateScopeFormStateOperations(newOptions);
      onChange?.(newOptions);
      setIsDirty?.();
    },
    [isInherited, onChange, setIsDirty, updateScopeFormStateOperations],
  );

  const isOptionSelectedOrDisabled = useCallback(
    (option: OperationSelectOption) => {
      return mergedOperations.some((currentOption) => {
        return (
          option.operation === currentOption.operation &&
          option.scopeTypeName === currentOption.scopeTypeName
        );
      });
    },
    [mergedOperations],
  );

  const onGroupBy = useCallback((option: OperationSelectOption) => {
    return option.scopeTypeName;
  }, []);

  const renderOptionLabel = useCallback((option: OperationSelectOption) => {
    return option.operation;
  }, []);

  const renderOption = useCallback(
    (
      props: React.HTMLAttributes<HTMLLIElement>,
      option: OperationSelectOption,
      state: {
        inputValue: string;
        index: number;
        selected: boolean;
      },
    ) => (
      <li {...props}>
        <Grid container justifyContent='space-between' alignItems='center'>
          <Typography>{option.operation}</Typography>
          {state.selected && <CheckIcon />}
        </Grid>
      </li>
    ),
    [],
  );

  return (
    <div className={className}>
      <Autocomplete
        groupBy={isProductSingleScoped() ? undefined : onGroupBy}
        value={mergedOperations}
        onChange={onChangeAndMergeHandler}
        multiple
        data-testid='autocomplete'
        renderTags={renderSelectedChips}
        getOptionDisabled={isOptionSelectedOrDisabled}
        isOptionEqualToValue={isOptionSelectedOrDisabled}
        options={options}
        renderOption={renderOption}
        getOptionLabel={renderOptionLabel}
        renderInput={(params) => (
          <TextField
            {...params}
            label=''
            placeholder={
              mergedOperations.length === 0 ? translate('Label.SelectOperations') : undefined
            }
            InputProps={{
              ...params.InputProps,
            }}
          />
        )}
      />
    </div>
  );
};

export default MultiSelectAutocomplete;
