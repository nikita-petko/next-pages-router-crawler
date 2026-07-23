import type { FC } from 'react';
import { useCallback, useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import { Grid } from '@rbx/ui';
import type { FormattedText } from '@modules/analytics-translations/types';
import FilterDrawerButton from '@modules/charts-generic/components/FilterDrawer/FilterDrawerButton';
import FilterDrawerGroup from '@modules/charts-generic/components/FilterDrawer/FilterDrawerGroup';
import getAppLayoutContentContainerElement from '@modules/navigation/utils/getAppLayoutContentContainerElement';
import type {
  FilterDrawerChoicesType,
  GroupActivityHistoryFilterCategories,
} from '../constants/groupConstants';
import {
  GroupActivityHistoryFilterDimensions,
  GroupActivityHistoryFilterCategoriesMapping,
  GroupActivityHistoryFilterOptionsToTranslationKey,
  GroupActivityHistoryFilterOptionsMapping,
} from '../constants/groupConstants';
import useGroupActivityHistoryControllerStyles from './GroupActivityHistoryController.styles';
import GroupActivityHistoryFilterMenu from './GroupActivityHistoryFilterMenu';

type GroupActivityHistoryFilterColumnChoiceProps = {
  name: FormattedText;
  eventDimension: GroupActivityHistoryFilterDimensions;
  filters: FilterDrawerChoicesType;
  onFilterChange: (
    key: GroupActivityHistoryFilterDimensions,
    newValue: GroupActivityHistoryFilterCategories[],
  ) => void;
  multiple?: boolean;
};

const GroupActivityHistoryFilterColumnChoice: FC<GroupActivityHistoryFilterColumnChoiceProps> = ({
  name,
  filters,
  eventDimension,
  onFilterChange,
  multiple,
}) => {
  const { translate } = useTranslation();

  const getEnumOptions = (dimension: GroupActivityHistoryFilterDimensions) => {
    return GroupActivityHistoryFilterOptionsMapping[dimension];
  };

  const formatOption = useCallback(
    (option: GroupActivityHistoryFilterCategories) =>
      translate(GroupActivityHistoryFilterOptionsToTranslationKey[option]) as FormattedText,
    [translate],
  );

  return (
    <GroupActivityHistoryFilterMenu
      type='Column'
      name={name}
      enumOptions={getEnumOptions(eventDimension)}
      initial={filters[eventDimension]?.length > 0 ? filters[eventDimension] : []}
      formatOption={formatOption}
      onChangeSubmit={(selectedOptions: GroupActivityHistoryFilterCategories[]) =>
        onFilterChange(eventDimension, selectedOptions)
      }
      overrideSignal={filters[eventDimension]}
      multiple={multiple}
    />
  );
};

type GroupActivityHistoryFilterDropdownChoiceProps = {
  name: FormattedText;
  allUsernames: string[];
  usernames: string[];
  setUsernames: (selected: string[]) => void;
  multiple?: boolean;
};

const GroupActivityHistoryFilterDropdownChoice: FC<
  GroupActivityHistoryFilterDropdownChoiceProps
> = ({ name, allUsernames, usernames, setUsernames, multiple }) => {
  return (
    <GroupActivityHistoryFilterMenu
      type='Dropdown'
      name={name}
      enumOptions={allUsernames}
      initial={usernames}
      formatOption='literal'
      onChangeSubmit={(selectedOptions: string[]) => setUsernames(selectedOptions)}
      overrideSignal={usernames}
      multiple={multiple}
    />
  );
};

type GroupActivityHistoryFilterDrawerProps = {
  filterDimensions: GroupActivityHistoryFilterDimensions[];
  filters: FilterDrawerChoicesType;
  onFilterChange: (
    key: GroupActivityHistoryFilterDimensions,
    newValue: GroupActivityHistoryFilterCategories[],
  ) => void;
  allUsernames: string[];
  usernames: string[];
  setUsernames: (selected: string[]) => void;
};

const GroupActivityHistoryFilterDrawer: FC<GroupActivityHistoryFilterDrawerProps> = ({
  filterDimensions,
  filters,
  onFilterChange,
  allUsernames,
  usernames,
  setUsernames,
}) => {
  const {
    classes: { controlBarFilter },
  } = useGroupActivityHistoryControllerStyles();

  const { translate } = useTranslation();

  const filterDrawerContent = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- index not required
    return Array.from(filterDimensions.entries()).map(([_, eventDimension]) => {
      const groupName = translate(
        GroupActivityHistoryFilterOptionsToTranslationKey[eventDimension],
      ) as FormattedText;
      if (eventDimension === GroupActivityHistoryFilterDimensions.Creator) {
        return (
          <FilterDrawerGroup name={groupName} key={groupName}>
            <GroupActivityHistoryFilterDropdownChoice
              name={'' as FormattedText}
              allUsernames={allUsernames}
              usernames={usernames}
              setUsernames={setUsernames}
              multiple
            />
          </FilterDrawerGroup>
        );
      }
      const subDimensions = GroupActivityHistoryFilterCategoriesMapping[eventDimension];
      if (subDimensions.length > 0) {
        return (
          <FilterDrawerGroup name={groupName} key={groupName}>
            {subDimensions.map((subDimension) => (
              <GroupActivityHistoryFilterColumnChoice
                key={subDimension}
                name={
                  translate(
                    GroupActivityHistoryFilterOptionsToTranslationKey[subDimension],
                  ) as FormattedText
                }
                eventDimension={subDimension}
                filters={filters}
                onFilterChange={onFilterChange}
                multiple
              />
            ))}
          </FilterDrawerGroup>
        );
      }
      return (
        <FilterDrawerGroup name={groupName} key={groupName}>
          <GroupActivityHistoryFilterColumnChoice
            name={'' as FormattedText}
            eventDimension={eventDimension}
            filters={filters}
            onFilterChange={onFilterChange}
            multiple
          />
        </FilterDrawerGroup>
      );
    });
  }, [filterDimensions, translate, filters, onFilterChange, allUsernames, usernames, setUsernames]);

  return (
    <Grid item className={controlBarFilter}>
      <FilterDrawerButton
        getDrawerContainer={getAppLayoutContentContainerElement}
        buttonLabel={translate('Action.FilterBy') as FormattedText}
        drawerTitle={translate('Label.FilterByCategory') as FormattedText}
        filterDrawerContent={filterDrawerContent}
      />
    </Grid>
  );
};

export default GroupActivityHistoryFilterDrawer;
