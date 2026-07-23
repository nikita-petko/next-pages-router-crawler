import { useState, useEffect, useCallback } from 'react';
import { SearchCreatorType } from '@rbx/client-universes-api/v1';
import { useTranslation } from '@rbx/intl';
import { Grid, Typography, Autocomplete, TextField, SearchIcon, WarningIcon } from '@rbx/ui';
import type { ScopeInfo } from '@modules/clients/cloudAuthentication';
import isLegacyProduct from '../../common/utils/legacyUtil';
import useScopeFormState from '../hooks/useScopeFormState';
import useScopeSystem from '../hooks/useScopeSystem';
import useAccessPermissionFormStyles from './AccessPermissionsForm.styles';
import ProductForm from './ProductForm';

interface AccessPermissionsFormProps {
  setIsDirty?: () => void;
  compact: boolean;
  creatorType: SearchCreatorType;
  creatorTargetId?: number;
  scopeInfos?: ScopeInfo[];
  staleUniverseIds?: Set<string>;
}

const AccessPermissionsForm = ({
  setIsDirty,
  compact,
  creatorType,
  creatorTargetId,
  scopeInfos,
  staleUniverseIds,
}: AccessPermissionsFormProps) => {
  const {
    classes: {
      subLabel,
      accessPermissionSubLabel,
      searchApiContainer,
      searchApiList,
      warningContainer,
      warningItem,
    },
  } = useAccessPermissionFormStyles();
  const { translate } = useTranslation();
  const { getProductNames } = useScopeSystem();
  const { addScopeInfoToScopeType, getSelectedProducts, removeProduct, addProduct } =
    useScopeFormState();

  const [selectedProductNames, setSelectedProductNames] = useState<string[]>([]);

  useEffect(() => {
    if (typeof scopeInfos !== 'undefined') {
      scopeInfos.forEach((scopeInfo) => {
        addScopeInfoToScopeType(scopeInfo);
      });
      // after the scopeInfos are loaded in, get the selected Products
      setSelectedProductNames(getSelectedProducts());
    }
  }, [scopeInfos, addScopeInfoToScopeType, getSelectedProducts]);

  const onAddProduct = useCallback(
    (selectedProduct: string) => {
      if (
        selectedProduct === '' ||
        selectedProductNames.includes(selectedProduct) ||
        (creatorType === SearchCreatorType.Group && isLegacyProduct(selectedProduct))
      ) {
        return;
      }

      addProduct(selectedProduct);
      // reset the local state to match the central context state
      setSelectedProductNames((prevSelectedProducts) =>
        [selectedProduct].concat(prevSelectedProducts),
      );
      setIsDirty?.();
    },
    [addProduct, setIsDirty, creatorType, selectedProductNames],
  );

  const onRemoveProduct = useCallback(
    (productIndex: number) => {
      // reset the local state to match the central context state.
      setSelectedProductNames((prevProductNames) => {
        removeProduct(prevProductNames[productIndex]);
        const prevProductsCpy = [...prevProductNames];
        prevProductsCpy.splice(productIndex, 1);
        return prevProductsCpy;
      });
      setIsDirty?.();
    },
    [setIsDirty, removeProduct],
  );

  return (
    <Grid container alignItems='center'>
      {creatorType === SearchCreatorType.Group && (
        <Grid container alignItems='center' spacing={1} className={warningContainer}>
          <Grid item className={warningItem}>
            <WarningIcon color='warning' />
          </Grid>
          <Grid item className={warningItem}>
            <Typography variant='body1'>
              {translate('Description.GroupAPIKeyPermissionsWarning')}
            </Typography>
          </Grid>
        </Grid>
      )}
      <Grid container alignItems='left' direction='column'>
        <Grid item XSmall={8} Medium={5} Large={4} classes={{ root: searchApiContainer }}>
          <Autocomplete
            data-testid='autocomplete'
            autoHighlight
            openOnFocus
            blurOnSelect
            disabledItemsFocusable
            value={null}
            onChange={(_, value) => onAddProduct(value ?? '')}
            options={getProductNames().sort()}
            getOptionDisabled={(option) =>
              selectedProductNames.includes(option) ||
              (creatorType === SearchCreatorType.Group && isLegacyProduct(option))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: <SearchIcon />,
                }}
                size='small'
                label={params.inputProps.value ? translate('Message.SelectAPISystem') : ''}
                placeholder={translate('Message.SelectAPISystem')}
              />
            )}
            renderOption={(props, option) => (
              <li {...props}>
                <Grid container alignItems='center'>
                  <Typography>{option}</Typography>
                </Grid>
              </li>
            )}
            componentsProps={{
              popper: {
                modifiers: [
                  // forces the dropdown to always be below the button and not flip
                  {
                    name: 'flip',
                    enabled: false,
                  },
                ],
                // ensures that list dropdown's width fits the largest scope defined
                className: searchApiList,
              },
            }}
          />
        </Grid>
        <Grid item>
          <Typography
            classes={{ root: subLabel }}
            variant='body1'
            color='primary'
            component='body1'>
            {translate('Description.AddAPISystem')}
          </Typography>
        </Grid>
      </Grid>
      {selectedProductNames.length !== 0 ? (
        <Grid item XSmall={12} Medium={12}>
          {selectedProductNames.map((name, index) => {
            return (
              <ProductForm
                creatorType={creatorType}
                creatorTargetId={creatorTargetId}
                compact={compact}
                onDelete={() => onRemoveProduct(index)}
                key={name}
                className={accessPermissionSubLabel}
                productName={name}
                setIsDirty={setIsDirty}
                staleUniverseIds={staleUniverseIds}
              />
            );
          })}
        </Grid>
      ) : (
        <Grid className={accessPermissionSubLabel} item XSmall={12}>
          <Typography variant='body1' color='primary'>
            {translate('Description.NoAPISystems')}
          </Typography>
        </Grid>
      )}
    </Grid>
  );
};

export default AccessPermissionsForm;
