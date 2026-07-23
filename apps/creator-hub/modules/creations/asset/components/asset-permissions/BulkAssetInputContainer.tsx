import React, { FunctionComponent, useCallback, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import {
  ApiPermissionStatus,
  AssetConsumerAction,
  SubjectType,
} from '@rbx/clients/assetPermissionsApi';
import { Button, TextField, FormHelperText, Grid } from '@rbx/ui';
import { assetPermissionsApiClient } from '@modules/clients';
import { TAssetDetails } from './types';
import UseAssetPermissionsStyles from './AssetPermissionsContainer.styles';
import getAssetDetails, { MAX_PAGE_SIZE } from './common';

type BulkAssetInputContainerProps = {
  userId: number;
  onItemsAdd: (itemIds: Map<number, TAssetDetails>) => void;
};

const BulkAssetInputContainer: FunctionComponent<
  React.PropsWithChildren<BulkAssetInputContainerProps>
> = ({ userId, onItemsAdd }) => {
  const {
    classes: { buttonText, helperText },
  } = UseAssetPermissionsStyles();
  const { translate } = useTranslation();

  // State for storing the data
  const [inputErrors, setInputErrors] = useState<string[]>([]);
  const [isAddingToListLoading, setIsAddingToListLoading] = useState<boolean>(false);
  const [textFieldInputValue, setTextFieldInputValue] = useState<string>('');

  const handleAddAssetIdsToList = useCallback(async () => {
    const currentInputErrors: string[] = [];
    setIsAddingToListLoading(true);
    setInputErrors([]);
    setTextFieldInputValue('');

    // This validates that the input only has digits and commas
    const isValid = textFieldInputValue.match(/^[0-9,\s\b]*$/);
    const cleanedInput = textFieldInputValue
      .replace(/\s/g, '') // Remove all whitespace
      .replace(/,+\s*$/, '') // Remove double and trailing commas
      .trim();
    if (!(isValid && cleanedInput)) {
      setInputErrors([translate('Error.InvalidFormat')]);
      setIsAddingToListLoading(false);
      return;
    }

    const inputUniqueAssetIds = Array.from(
      // This splits the input by commas to get all the experience ids
      new Set(cleanedInput.split(/[,]+/).map((id) => Number(id))),
      (value) => value,
    );
    if (inputUniqueAssetIds.length === 0) {
      setIsAddingToListLoading(false);
      return;
    }
    if (inputUniqueAssetIds.length > MAX_PAGE_SIZE) {
      setInputErrors([
        translate('Error.IdLimitExceeded', {
          limit: MAX_PAGE_SIZE.toString(),
        }),
      ]);
      setIsAddingToListLoading(false);
      return;
    }

    try {
      // if it is invalid type or some missing details, show error for those but continue to add remaining in the list.
      const [pendingAssetIdsMap, invalidAssetTypeIdsSet, missingAssetDetailsMap] =
        await getAssetDetails(inputUniqueAssetIds);

      // Invalid asset types.
      if (invalidAssetTypeIdsSet.size > 0) {
        currentInputErrors.push(
          translate('Error.InvalidAssetType', {
            ids: Array.from(invalidAssetTypeIdsSet).join(', '),
          }),
        );
      }

      // Missing asset details.
      if (missingAssetDetailsMap.size > 0) {
        currentInputErrors.push(
          missingAssetDetailsMap.size === 1
            ? translate('Error.IdsDoesNotExist', {
                id: Array.from(missingAssetDetailsMap.keys()).join(', '),
              })
            : translate('Error.IdsDoNotExist', {
                ids: Array.from(missingAssetDetailsMap.keys()).join(', '),
              }),
        );
      }

      // check asset permissions
      const assetIdsToGrant = Array.from(pendingAssetIdsMap.keys());
      if (assetIdsToGrant.length === 0) {
        setInputErrors(currentInputErrors);
        setIsAddingToListLoading(false);
        return;
      }

      const response = await assetPermissionsApiClient.batchCheckAssetPermissions(
        assetIdsToGrant.map((assetId) => {
          return {
            assetId,
            subject: SubjectType.User,
            subjectId: userId.toString(),
            permissionType: AssetConsumerAction.Use,
          };
        }),
      );

      const assetsWithoutPermission: number[] = [];
      const assetsWithPermission: number[] = [];
      assetIdsToGrant.forEach((assetId, index) => {
        if (response?.at(index)?.value?.status === ApiPermissionStatus.HasPermission) {
          assetsWithPermission.push(assetId);
        } else {
          assetsWithoutPermission.push(assetId);
        }
      });

      if (assetsWithoutPermission.length > 0) {
        currentInputErrors.push(
          translate('Error.NoPermissionAssetIds', { ids: assetsWithoutPermission.join(', ') }),
        );
      }

      // update pending assetIds list in parent component.
      if (assetsWithPermission.length > 0) {
        const filteredAssetDetailsMap = new Map<number, TAssetDetails>();
        assetsWithPermission.map((a) =>
          filteredAssetDetailsMap.set(a, pendingAssetIdsMap.get(a) as TAssetDetails),
        );
        onItemsAdd(filteredAssetDetailsMap);
      }
      setInputErrors(currentInputErrors);
    } catch (error) {
      setInputErrors([translate('Error.AssetDetailsFetchGeneric')]);
    } finally {
      setIsAddingToListLoading(false);
    }
  }, [userId, onItemsAdd, translate, textFieldInputValue]);

  const handleTextFieldOnChange = useCallback((input: string) => {
    setTextFieldInputValue(input);
  }, []);

  return (
    <Grid container item XSmall={12}>
      <Grid container spacing={2}>
        <Grid item XSmall={8}>
          <TextField
            error={inputErrors.length !== 0}
            fullWidth
            id='privateAssetToAdd'
            inputProps={{ 'data-testid': 'privateAssetToAdd' }}
            label={translate('Label.GrantInput')}
            onChange={(event) => handleTextFieldOnChange(event.target.value)}
            size='small'
            value={textFieldInputValue}
          />
          <FormHelperText
            classes={{ root: helperText }}
            component='div'
            error={inputErrors.length !== 0}>
            {inputErrors.length === 0 ? (
              translate('Message.InputSeparator')
            ) : (
              <Grid>
                {inputErrors.map((value) => (
                  <Grid key={value}>{value}</Grid>
                ))}
              </Grid>
            )}
          </FormHelperText>
        </Grid>
        <Grid item XSmall={4}>
          <Button
            classes={{ root: buttonText }}
            color='primary'
            disabled={textFieldInputValue === ''}
            loading={isAddingToListLoading}
            onClick={() => handleAddAssetIdsToList()}
            size='large'
            variant='outlined'>
            {translate('Button.Add')}
          </Button>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default React.memo(BulkAssetInputContainer);
