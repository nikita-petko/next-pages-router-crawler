import React, { FunctionComponent, useCallback } from 'react';
import {
  TableContainer,
  TableCell,
  TableBody,
  TableHead,
  Table,
  Divider,
  Typography,
  TableRow,
} from '@rbx/ui';
import { CreatorType } from '@rbx/clients/assetPermissionsApi';
import { useTranslation } from '@rbx/intl';
import { ExtendedGetAssetDependenciesResult } from '@modules/react-query/assetPermissions/assetPermissionsQueries';
import CompositeAssetDependenciesTableRow from './CompositeAssetDependenciesTableRow';
import useCompositeAssetDependenciesTableStyles from './CompositeAssetDependenciesTable.styles';
import { OptionalDependencyAttribute } from '../constants/tableConstants';

export type CompositeAssetDependenciesTableProps = {
  dependencies: ExtendedGetAssetDependenciesResult[];
  optionalAttributesToShow: Set<OptionalDependencyAttribute> | null;
  parentCreator: { id: number; type: CreatorType };
};

const CompositeAssetDependenciesTable: FunctionComponent<
  React.PropsWithChildren<CompositeAssetDependenciesTableProps>
> = ({ dependencies, optionalAttributesToShow, parentCreator }) => {
  const { translate } = useTranslation();
  const {
    classes: { table, tableContainer },
  } = useCompositeAssetDependenciesTableStyles();

  const renderHeaderCell = useCallback(
    (label: string) => {
      return (
        <TableCell>
          <Typography>{translate(label)}</Typography>
        </TableCell>
      );
    },
    [translate],
  );

  return (
    <TableContainer
      data-testid='compositeAssetDependenciesTable'
      classes={{ root: tableContainer }}>
      <Table stickyHeader classes={{ root: table }}>
        <TableHead>
          <TableRow>
            {renderHeaderCell('Label.DependenciesTableColumnAsset')}
            {renderHeaderCell('Label.DependenciesTableColumnAssetId')}
            {optionalAttributesToShow?.has(OptionalDependencyAttribute.Creator) &&
              renderHeaderCell('Label.DependenciesTableColumnCreator')}
            {optionalAttributesToShow?.has(OptionalDependencyAttribute.AssetType) &&
              renderHeaderCell('Label.DependenciesTableColumnType')}
            {optionalAttributesToShow?.has(OptionalDependencyAttribute.AccessStatus) &&
              renderHeaderCell('Label.DependenciesTableColumnAssetPrivacyLevel')}
          </TableRow>
        </TableHead>
        <TableBody>
          {dependencies.map((dependency) => (
            <CompositeAssetDependenciesTableRow
              key={dependency.assetId}
              dependency={dependency}
              optionalAttributesToShow={optionalAttributesToShow}
              parentCreator={parentCreator}
            />
          ))}
        </TableBody>
      </Table>
      <Divider />
    </TableContainer>
  );
};

export default CompositeAssetDependenciesTable;
