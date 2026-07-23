import React, { FunctionComponent } from 'react';
import { useTranslation } from '@rbx/intl';
import { Select, MenuItem } from '@rbx/ui';
import { Asset } from '@modules/miscellaneous/common';
import useCreateAssetFormStyles from './CreateAssetForm.styles';

export type TranslateReturnType = ReturnType<typeof useTranslation>['translate'];

export interface AssetSelectionInputs {
  selectionValue: string;
  label: string;
  listOfInputs: Asset[];
  translateFunction: TranslateReturnType;
  handleChange: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
}

const AssetSelection: FunctionComponent<React.PropsWithChildren<AssetSelectionInputs>> = ({
  selectionValue,
  label,
  listOfInputs,
  translateFunction,
  handleChange,
}) => {
  const {
    classes: { AssetTypeSelection },
  } = useCreateAssetFormStyles();
  return (
    <Select
      size='medium'
      className={AssetTypeSelection}
      label={label}
      value={selectionValue}
      onChange={handleChange}>
      {listOfInputs.map((type) => {
        return (
          <MenuItem key={type} value={type}>
            {translateFunction(type)}
          </MenuItem>
        );
      })}
    </Select>
  );
};

export default AssetSelection;
