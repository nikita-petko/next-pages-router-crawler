import { Fragment, useCallback, useMemo, useState } from 'react';
import type { V1SearchUniversesGetLimitEnum } from '@rbx/client-develop/v1';
import { SearchCreatorType } from '@rbx/client-universes-api/v1';
import type { PageResponse, PagingParameters } from '@rbx/core';
import { Key } from '@rbx/core';
import { useTranslation } from '@rbx/intl';
import { SearchIcon, Input, Grid } from '@rbx/ui';
import { useAuthentication } from '@modules/authentication/providers';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import ItemGridContainer from '../../common/containers/ItemGridContainer';
import targetPartItemGridConstants from '../constants/targetPartItemGridConstants';
import type TargetPartMetadata from '../interfaces/TargetPartMetadata';
import {
  getTargetPartListApi,
  getTargetPartTranslations,
} from '../utils/targetPartConfigurationUtils';
import useTargetPartGridStyles from './TargetPartGrid.styles';
import withCustomGridItemHandlers from './withCustomGridItemHandlers';

interface TargetPartGridSelectorProps {
  parentTargetPartValue: string;
  targetPartName: string;
  onAddTargetValue: (targetPartValue: string) => void;
  isTargetValueSelected: (targetPartValue: string) => void;
  gridPageWidthGetter: () => number | undefined;
}

interface TargetPartListPagingParameters extends PagingParameters {
  queryString?: string;
  parentTargetId?: number;
}

const TargetPartGridSelector = ({
  parentTargetPartValue,
  targetPartName,
  onAddTargetValue,
  isTargetValueSelected,
  gridPageWidthGetter,
}: TargetPartGridSelectorProps) => {
  const { settings } = useSettings();
  const {
    classes: { inputContainer, startAdornment },
  } = useTargetPartGridStyles();
  const { translate } = useTranslation();
  const [emptyMsg, setEmptyMsg] = useState<string>('');
  const [query, setQuery] = useState<string>('');
  const [pagingParameters, setPagingParameters] = useState<TargetPartListPagingParameters>({
    parentTargetId: parseInt(parentTargetPartValue, 10),
    queryString: '',
  });

  const currentGroup = useCurrentGroup();
  const { user } = useAuthentication();

  const translationKeys = useMemo(
    () => getTargetPartTranslations(targetPartName),
    [targetPartName],
  );

  // get datastores list endpoint
  const fetchDatastores = useCallback(
    async (
      parameters: TargetPartListPagingParameters,
    ): Promise<PageResponse<TargetPartMetadata>> => {
      if (parameters.queryString?.length === 0) {
        return {
          items: [],
        };
      }
      const getTargets = getTargetPartListApi(targetPartName);
      const targetsResponse = await getTargets?.({
        creatorType: currentGroup?.id ? SearchCreatorType.Group : SearchCreatorType.User,
        creatorTargetId: currentGroup?.id || user?.id,
        queryString: parameters.queryString,
        parentTargetId: parameters.parentTargetId,
        limit: parameters.count as V1SearchUniversesGetLimitEnum,
        cursor: parameters.cursor,
        settings,
      });
      return {
        items: targetsResponse?.data ?? [],
        nextPageCursor: targetsResponse?.nextPageCursor,
      };
    },
    [currentGroup?.id, settings, targetPartName, user?.id],
  );

  // grid item 'add' button was clicked
  const onSelectDatastore = useCallback(
    (item: TargetPartMetadata) => {
      if (item.name !== undefined) {
        onAddTargetValue(item.name);
      }
    },
    [onAddTargetValue],
  );

  // grid item was already selected
  const isItemDisabled = useCallback(
    (item: TargetPartMetadata) => {
      if (item.name !== undefined) {
        isTargetValueSelected(item.name);
        return;
      }
      return false;
    },
    [isTargetValueSelected],
  );

  // build unique key for each grid item
  const getItemKey = useCallback(
    (targetMetadata: TargetPartMetadata) => targetMetadata.name ?? '',
    [],
  );

  return (
    <>
      <Grid className={inputContainer}>
        <Grid item Medium={12} Large={8} XXLarge={4}>
          <Input
            fullWidth
            inputMode='search'
            placeholder={
              translationKeys?.gridKeys?.searchPlaceholder
                ? translate(translationKeys?.gridKeys?.searchPlaceholder)
                : translate('Message.GenericSearchPlaceholder')
            }
            startAdornment={<SearchIcon className={startAdornment} />}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === Key.Enter) {
                setEmptyMsg(
                  translationKeys?.gridKeys?.noResultsTextKey
                    ? translate(translationKeys?.gridKeys?.noResultsTextKey)
                    : translate('Message.NoOptionsText'),
                );
                setPagingParameters((prevPagingParameters) => {
                  return {
                    ...prevPagingParameters,
                    queryString: query,
                  };
                });
              }
            }}
          />
        </Grid>
      </Grid>
      <ItemGridContainer
        itemGridStaticConfigProperties={targetPartItemGridConstants}
        getGridWidth={gridPageWidthGetter}
        pagingParameters={pagingParameters}
        loadItems={fetchDatastores}
        getItemKey={getItemKey}
        GridItemComponent={withCustomGridItemHandlers(onSelectDatastore, isItemDisabled)}
        errorMessage={
          translationKeys?.gridKeys?.errorKey
            ? translate(translationKeys?.gridKeys?.errorKey)
            : translate('Message.GenericSearchError')
        }
        emptyMessage={emptyMsg}
        retryBtnMessage={translate('Button.Reload')}
      />
    </>
  );
};

export default TargetPartGridSelector;
