import React, { FunctionComponent } from 'react';
import { TableCell, TableRow, Button } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import Asset from '@modules/miscellaneous/common/enums/Asset';
import { assetTypeToSingularNameKeys } from '@modules/miscellaneous/common/constants/commonConstants';
import UseAssetPermissionsStyles from './AssetPermissionsContainer.styles';

type UniverseAssetDetailsRowInput = {
  assetId: number;
  name: string;
  assetType: Asset | null;
  creatorName: string;
  canBeRemoved: boolean;
  alreadyAdded?: boolean;
  onItemRemove: (itemId: number) => void;
};

const UniverseAssetDetailsRow: FunctionComponent<
  React.PropsWithChildren<UniverseAssetDetailsRowInput>
> = ({ assetId, name, assetType, creatorName, canBeRemoved, alreadyAdded, onItemRemove }) => {
  const {
    classes: { fixWidthColumn, xsInvisibleColumn, buttonText },
    cx,
  } = UseAssetPermissionsStyles();
  const { translate } = useTranslation();
  return (
    <TableRow>
      <TableCell className={cx(fixWidthColumn, xsInvisibleColumn)}>
        {name === '' ? translate('Label.Private') : name}
      </TableCell>
      <TableCell className={cx(fixWidthColumn, xsInvisibleColumn)}>{assetId}</TableCell>
      <TableCell className={cx(fixWidthColumn, xsInvisibleColumn)}>
        {creatorName === '' ? translate('Label.Private') : creatorName}
      </TableCell>
      <TableCell className={cx(fixWidthColumn, xsInvisibleColumn)}>
        {assetType === null
          ? translate('Label.Private')
          : translate(assetTypeToSingularNameKeys[assetType])}
      </TableCell>
      <TableCell className={cx(fixWidthColumn, xsInvisibleColumn)} align='right'>
        {(canBeRemoved && (
          <Button
            classes={{ root: buttonText }}
            color='destructive'
            onClick={() => onItemRemove(assetId)}
            variant='text'>
            {translate('Action.Remove')}
          </Button>
        )) ||
          (alreadyAdded && (
            <Button classes={{ root: buttonText }} color='primary' disabled variant='text'>
              {translate('Action.Added')}
            </Button>
          ))}
      </TableCell>
    </TableRow>
  );
};

export default UniverseAssetDetailsRow;
