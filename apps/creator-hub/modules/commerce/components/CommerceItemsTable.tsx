import React, { FunctionComponent, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Checkbox,
  DeleteOutlinedIcon,
  Grid,
  IconButton,
  makeStyles,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
} from '@rbx/ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { CommerceItemModel } from '@modules/clients/commerce';
import ThumbnailImage from './ThumbnailImage';
import useFormatters from '../hooks/useFormatters';

interface CommerceItemsTableProps {
  commerceItems: CommerceItemModel[];
  showCheckboxes?: boolean;
  showArchiveButtons?: boolean;
  onClickArchive?: (commerceItemIds: string[]) => void;
  handleSelectedChange?: (commerceItemIds: string[]) => void;
  deselectedCommerceItemIds?: string[];
  setDeselectedCommerceItemIds?: React.Dispatch<React.SetStateAction<string[]>>;
  catalogSelectedCommerceItemIds?: string[];
  setCatalogSelectedCommerceItemIds?: React.Dispatch<React.SetStateAction<string[]>>;
  updateCatalogSelectedCommerceItemIds?: boolean;
  useCatalogSelectedCommerceItemIds?: boolean;
}

const useStyles = makeStyles()((theme) => ({
  pagination: {
    whiteSpace: 'nowrap',
    borderBottom: 'none',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  paginationToolbar: {
    padding: 0,
    minHeight: 60,
  },
  thumbnailContainer: {
    height: 48,
    width: 48,
    borderRadius: theme.border.radius.xsmall.borderRadius,
    overflow: 'hidden',
  },
  columnCollapsed: {
    width: 0,
  },
  row: {
    '&:not(:hover) .showOnRowHover': {
      opacity: 0,
      [theme.breakpoints.down('Medium')]: {
        opacity: 1,
      },
    },
  },
  cellCompact: {
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
    maxWidth: 0,
  },
  hideIfDisabled: {
    '&:disabled': {
      opacity: 0,
    },
  },
  mutedContent: {
    color: theme.palette.content.muted,
  },
  standardContent: {
    color: theme.palette.content.standard,
  },
  checkBox: {
    padding: 8,
  },
}));

type SelectedState = Record<string, boolean>;

/**
 * Selectable table of commerce items.
 */
const CommerceItemsTable: FunctionComponent<CommerceItemsTableProps> = ({
  commerceItems,
  showCheckboxes,
  showArchiveButtons,
  onClickArchive,
  handleSelectedChange,
  deselectedCommerceItemIds,
  setDeselectedCommerceItemIds,
  catalogSelectedCommerceItemIds,
  setCatalogSelectedCommerceItemIds,
  updateCatalogSelectedCommerceItemIds,
  useCatalogSelectedCommerceItemIds,
}) => {
  const { translate } = useTranslation();
  const { classes, cx } = useStyles();
  const { formatPrice } = useFormatters();
  // TODO(SUBS-3216): share / persist user-selected pagination row counts across commerce table UIs
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);

  const getDefaultValues = useCallback(
    (value: boolean) => {
      return commerceItems.reduce((acc, item) => {
        acc[item.id] = value;
        return acc;
      }, {} as SelectedState);
    },
    [commerceItems],
  );

  const { control, watch, setValue, reset, register, unregister } = useForm<SelectedState>({
    defaultValues: getDefaultValues(false), // Initialize all checkboxes as unchecked
  });

  const selectedState = watch();

  // Prevent pagination from going out of bounds (e.g. when archiving items)
  useEffect(() => {
    setPage((prevPage) => {
      if (prevPage * rowsPerPage >= commerceItems.length) {
        return Math.floor((commerceItems.length - 1) / rowsPerPage);
      }
      return prevPage;
    });
  }, [commerceItems, rowsPerPage, page]);

  useEffect(() => {
    const commerceIds = new Set(commerceItems.map((item) => item.id));
    const stateCommerceIds = new Set(Object.keys(selectedState));

    Object.keys(selectedState).forEach((itemId) => {
      if (!commerceIds.has(itemId)) {
        unregister(itemId);
      }
    });

    commerceItems.forEach((item) => {
      if (!stateCommerceIds.has(item.id)) {
        register(item.id);
        setValue(item.id, false); // Preserve existing state and add new item
      }
    });
  }, [commerceItems, selectedState, setValue, register, unregister]);

  useEffect(() => {
    deselectedCommerceItemIds?.forEach((itemId) => {
      setValue(itemId, false); // Remove deselected items from configure step
    });
    if ((deselectedCommerceItemIds ?? []).length > 0) {
      setDeselectedCommerceItemIds?.([]);
    }
  }, [commerceItems, deselectedCommerceItemIds, setDeselectedCommerceItemIds, setValue]);

  const selectedCount = useMemo(
    () => Object.values(selectedState).filter(Boolean).length,
    [selectedState],
  );

  const selectedItemIds = useMemo(
    () =>
      Object.entries(selectedState)
        .filter(([, value]) => value)
        .map(([key]) => key),
    [selectedState],
  );

  useEffect(() => {
    handleSelectedChange?.(selectedItemIds);
  }, [selectedItemIds, handleSelectedChange]);

  // From create flow, select items from catalog tab, if any, and then reset
  useEffect(() => {
    if (useCatalogSelectedCommerceItemIds) {
      catalogSelectedCommerceItemIds?.forEach((itemId) => {
        setValue(itemId, true);
      });
      if ((catalogSelectedCommerceItemIds ?? []).length > 0) {
        setCatalogSelectedCommerceItemIds?.([]);
      }
    }
  }, [
    catalogSelectedCommerceItemIds,
    setCatalogSelectedCommerceItemIds,
    setValue,
    useCatalogSelectedCommerceItemIds,
  ]);

  // Keep track of selected catalog items for create flow
  useEffect(() => {
    if (
      updateCatalogSelectedCommerceItemIds &&
      catalogSelectedCommerceItemIds?.length !== selectedItemIds.length
    ) {
      setCatalogSelectedCommerceItemIds?.(selectedItemIds);
    }
  }, [
    selectedItemIds,
    catalogSelectedCommerceItemIds,
    setCatalogSelectedCommerceItemIds,
    useCatalogSelectedCommerceItemIds,
    updateCatalogSelectedCommerceItemIds,
  ]);

  return (
    <TableContainer>
      <Table padding='normal' size='medium'>
        <TableHead>
          <TableRow>
            {showCheckboxes && (
              <TableCell className={cx(classes.columnCollapsed, classes.checkBox)}>
                <Checkbox
                  color='secondary'
                  indeterminate={selectedCount > 0 && selectedCount < commerceItems.length}
                  checked={selectedCount === commerceItems.length}
                  onClick={() => {
                    reset(getDefaultValues(selectedCount === 0));
                  }}
                />
              </TableCell>
            )}
            <TableCell
              className={cx(selectedCount > 0 ? classes.standardContent : classes.mutedContent)}>
              {selectedCount > 0
                ? translate('Label.NSelected', { n: selectedCount.toString() })
                : translate('Label.CatalogItem')}
            </TableCell>
            <TableCell className={cx(classes.mutedContent, classes.columnCollapsed)} align='right'>
              {translate('Label.Price')}
            </TableCell>
            {showArchiveButtons && (
              <TableCell className={cx(classes.mutedContent, classes.columnCollapsed)}>
                <IconButton
                  aria-label={translate('Action.Delete')}
                  className={classes.hideIfDisabled}
                  color='default'
                  onClick={() =>
                    onClickArchive?.(
                      Object.entries(selectedState)
                        .filter(([, value]) => value)
                        .map(([key]) => key),
                    )
                  }
                  disabled={selectedCount === 0}>
                  <DeleteOutlinedIcon fontSize='large' />
                </IconButton>
              </TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {
            // TODO(SUBS-3217): lazy load pages
            commerceItems
              .slice(page * rowsPerPage, (page + 1) * rowsPerPage)
              .map((commerceItem) => {
                return (
                  <TableRow
                    className={classes.row}
                    key={commerceItem.id}
                    hover
                    selected={selectedState[commerceItem.id]}
                    onClick={() => {
                      if (showCheckboxes) {
                        setValue(commerceItem.id, !selectedState[commerceItem.id]);
                      }
                    }}>
                    {showCheckboxes && (
                      <TableCell className={classes.checkBox}>
                        <Controller
                          name={commerceItem.id}
                          control={control}
                          defaultValue={false}
                          render={({ field }) => {
                            return <Checkbox {...field} checked={field.value} color='secondary' />;
                          }}
                        />
                      </TableCell>
                    )}
                    <TableCell className={classes.cellCompact}>
                      <Grid container direction='row' alignItems='center' gap={2} wrap='nowrap'>
                        <Grid container className={classes.thumbnailContainer} flexShrink={0}>
                          <ThumbnailImage
                            imageAssetId={commerceItem.defaultImageAssetId}
                            imageUrl={commerceItem.defaultImageSourceUrl ?? ''}
                            alt={commerceItem.merchantItemDisplayName}
                          />
                        </Grid>
                        <Typography noWrap>{commerceItem.merchantItemDisplayName}</Typography>
                      </Grid>
                    </TableCell>
                    <TableCell align='right'>
                      <Typography>{formatPrice(commerceItem.lastSyncedPrice)}</Typography>
                    </TableCell>
                    {showArchiveButtons && (
                      <TableCell>
                        <Tooltip arrow placement='top' title={translate('Action.Delete')}>
                          <IconButton
                            aria-label={translate('Action.Delete')}
                            className={cx(classes.hideIfDisabled, 'showOnRowHover')}
                            color='default'
                            onClick={() => onClickArchive?.([commerceItem.id])}
                            disabled={selectedCount > 0}>
                            <DeleteOutlinedIcon fontSize='large' />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
          }
        </TableBody>
      </Table>
      <TablePagination
        className={classes.pagination}
        classes={{ toolbar: classes.paginationToolbar }}
        rowsPerPageOptions={[10, 20, 50]}
        count={commerceItems.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(_event: unknown, newPage: number) => {
          setPage(newPage);
        }}
        onRowsPerPageChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          setRowsPerPage(parseInt(event.target.value, 10));
          setPage(0);
        }}
      />
    </TableContainer>
  );
};

export default withTranslation(memo(CommerceItemsTable), [TranslationNamespace.Commerce]);
