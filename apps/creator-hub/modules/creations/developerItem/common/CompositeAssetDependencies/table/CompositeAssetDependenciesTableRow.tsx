import React, { FunctionComponent, useCallback, useMemo } from 'react';
import { Link, TableCell, TableRow, Typography, OpenInNewIcon } from '@rbx/ui';
import { creatorStore, dashboard } from '@modules/miscellaneous/common/urls/creatorHub';
import { Creator, CreatorType } from '@rbx/clients/assetPermissionsApi';
import { useTranslation } from '@rbx/intl';
import { ExtendedGetAssetDependenciesResult } from '@modules/react-query/assetPermissions/assetPermissionsQueries';
import {
  assetTypeToTranslationKey,
  accessStatusToTranslationKey,
  OptionalDependencyAttribute,
} from '../constants/tableConstants';
import useCompositeAssetDependenciesTableStyles from './CompositeAssetDependenciesTable.styles';

export type CompositeAssetDependenciesTableRowProps = {
  dependency: ExtendedGetAssetDependenciesResult;
  optionalAttributesToShow: Set<OptionalDependencyAttribute> | null;
  parentCreator: { id: number; type: CreatorType };
};

const wwwPath = `https://${process.env.robloxSiteDomain}`;
const getCreatorPath = (creator: Creator) => {
  switch (creator.type) {
    case CreatorType.User:
      return `${wwwPath}/users/${creator.id}/profile`;
    case CreatorType.Group:
      return `${wwwPath}/groups/${creator.id}`;
    default:
      return '';
  }
};

const CompositeAssetDependenciesTableRow: FunctionComponent<
  React.PropsWithChildren<CompositeAssetDependenciesTableRowProps>
> = ({ dependency, optionalAttributesToShow, parentCreator }) => {
  const { assetId, assetName, assetType, accessStatus, creator } = dependency;

  const { translate } = useTranslation();
  const { classes, cx } = useCompositeAssetDependenciesTableStyles();

  const translatedAssetType = useMemo(() => {
    if (!assetType) {
      return null;
    }
    const translationKey = assetTypeToTranslationKey(assetType);
    return translationKey ? translate(translationKey) : null;
  }, [assetType, translate]);

  const translatedAccessStatus = useMemo(() => {
    if (!accessStatus) {
      return null;
    }
    const translationKey = accessStatusToTranslationKey(accessStatus);
    return translationKey ? translate(translationKey) : null;
  }, [accessStatus, translate]);

  const renderTableCell = useCallback(
    (
      content: React.ReactNode | null,
      options: {
        link?: string | null;
        showOpenInNewIcon?: boolean;
        shouldTruncate?: boolean;
      } = {},
    ) => {
      if (!content) return <TableCell />;

      const { link, showOpenInNewIcon, shouldTruncate } = options;
      const showIcon = showOpenInNewIcon && link;

      const typographyContent = (
        <Typography className={cx(shouldTruncate && classes.truncatedText)}>{content}</Typography>
      );

      const cellContent = link ? (
        <Link
          color='inherit'
          target='_blank'
          href={link}
          className={cx(classes.cellLink, showIcon && classes.cellLinkWithIcon)}>
          {typographyContent}
          {showIcon && <OpenInNewIcon fontSize='small' />}
        </Link>
      ) : (
        typographyContent
      );

      return (
        <TableCell className={cx(shouldTruncate && classes.truncatedCell)}>{cellContent}</TableCell>
      );
    },
    [classes, cx],
  );

  if (!assetId || !assetName) {
    return null;
  }

  const dependencyCreatedByParentCreator =
    parentCreator?.id === creator?.id && parentCreator?.type === creator?.type;
  const assetUrl = dependencyCreatedByParentCreator
    ? dashboard.getConfigureCreatorStoreItemUrl(assetId) // Link to the Creator Hub page if the user is the creator
    : creatorStore.getAssetUrl(assetId); // Otherwise, link to the Creator Store page

  return (
    <TableRow data-testid='compositeAssetDependenciesTableRow'>
      {renderTableCell(dependency.assetName, {
        shouldTruncate: true,
      })}
      {renderTableCell(dependency.assetId, {
        link: assetUrl,
        showOpenInNewIcon: true,
      })}
      {optionalAttributesToShow?.has(OptionalDependencyAttribute.Creator) &&
        renderTableCell(dependency.creatorName, {
          link: creator ? getCreatorPath(creator) : null,
          shouldTruncate: true,
        })}
      {optionalAttributesToShow?.has(OptionalDependencyAttribute.AssetType) &&
        renderTableCell(translatedAssetType)}
      {optionalAttributesToShow?.has(OptionalDependencyAttribute.AccessStatus) &&
        renderTableCell(translatedAccessStatus)}
    </TableRow>
  );
};

export default CompositeAssetDependenciesTableRow;
