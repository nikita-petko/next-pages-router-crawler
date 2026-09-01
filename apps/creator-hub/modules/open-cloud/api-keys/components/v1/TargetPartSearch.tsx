import { Fragment, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { V1SearchUniversesGetLimitEnum } from '@rbx/client-develop/v1';
import { SearchCreatorType } from '@rbx/client-universes-api/v1';
import { useTranslation } from '@rbx/intl';
import { Autocomplete, CircularProgress, TextField, SearchIcon, InputAdornment } from '@rbx/ui';
import { useAuthentication } from '@modules/authentication/providers';
import { getResponseFromError } from '@modules/clients/utils';
import { useGroups } from '@modules/providers/groups/GroupsProvider';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import TargetPartNames from '../../enums/TargetPartNames';
import useScopeFormState from '../../hooks/useScopeFormState';
import type TargetPartMetadata from '../../interfaces/TargetPartMetadata';
import {
  getTargetPartListApi,
  getLoadCount,
  getTargetPartTranslations,
} from '../../utils/targetPartConfigurationUtils';

type TargetPartWithCreatorType = TargetPartMetadata & { ownership?: SearchCreatorType };

interface TargetPartSearchProps {
  className?: string;
  value?: string;
  targetPartName: string;
  onChange?: (id: string) => void; // all target parts are strings
  creatorType: SearchCreatorType;
  creatorTargetId?: number;
  selectedIds?: string[];
  disabled?: boolean;
}

const TargetPartSearch = ({
  className,
  targetPartName,
  onChange,
  creatorType,
  creatorTargetId,
  selectedIds = [],
  disabled = false,
}: TargetPartSearchProps) => {
  const { settings } = useSettings();
  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [universeOptions, setUniverseOptions] = useState<TargetPartWithCreatorType[]>([]);
  const [inputVal, setInputVal] = useState<string>('');
  const [selectedValue, setSelectedValue] = useState<TargetPartMetadata | null>(null);
  const [errorText, setErrorText] = useState<string>('');
  const [initialQueryMade, setInitialQueryMade] = useState<boolean>(false);

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { translate } = useTranslation();
  const { setResourceCache } = useScopeFormState();
  const { user } = useAuthentication();
  const { groups } = useGroups();

  const isCreatorTarget = targetPartName === TargetPartNames.Creator;

  const translationKeys = useMemo(
    () => getTargetPartTranslations(targetPartName),
    [targetPartName],
  );

  type TargetPartOption = Omit<TargetPartMetadata, 'id'> & {
    creatorType?: SearchCreatorType;
    id?: number | string;
  };

  const creatorOptions = useMemo<Array<TargetPartOption>>(() => {
    if (!isCreatorTarget) {
      return [];
    }

    const options: Array<TargetPartOption> = [];

    // Add user option
    if (user) {
      options.push({
        id: 'U',
        name: user.name,
        creatorType: SearchCreatorType.User,
      });
    }

    // Add group options
    if (groups && groups.length > 0) {
      groups.forEach((group) => {
        options.push({
          id: `G${group.id}`,
          name: group.name,
          creatorType: SearchCreatorType.Group,
        });
      });
    }

    // Sort by creatorType so user appear first then group
    options.sort((a, b) => {
      if (a.creatorType === SearchCreatorType.User && b.creatorType === SearchCreatorType.Group) {
        return -1;
      }
      if (a.creatorType === SearchCreatorType.Group && b.creatorType === SearchCreatorType.User) {
        return 1;
      }
      return 0;
    });

    return options;
  }, [isCreatorTarget, user, groups]);

  // Filter creator options based on search input
  const filteredCreatorOptions = useMemo(() => {
    if (!isCreatorTarget) {
      return [];
    }
    if (!inputVal) {
      return creatorOptions;
    }
    const searchLower = inputVal.toLowerCase();
    return creatorOptions.filter(
      (option) =>
        option.name?.toLowerCase().includes(searchLower) ||
        String(option.id).toLowerCase().includes(searchLower),
    );
  }, [isCreatorTarget, creatorOptions, inputVal]);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const handleOpen = useCallback(() => {
    setOpen(true);
  }, []);

  const fetchData = useCallback(
    async (keyword?: string) => {
      // For creator target, we use static list - no API calls needed
      if (isCreatorTarget) {
        setLoading(false);
        setInitialQueryMade(true);
        return;
      }

      const searchTerm = keyword !== undefined ? keyword : inputVal;
      const getTargets = getTargetPartListApi(targetPartName);

      if (getTargets) {
        const loadCount = getLoadCount(targetPartName);
        try {
          const userExperience = await getTargets({
            creatorType,
            creatorTargetId,
            queryString: searchTerm,
            limit: loadCount as V1SearchUniversesGetLimitEnum,
            settings,
          });

          const userExperiences: TargetPartWithCreatorType[] = (userExperience.data ?? []).map(
            (resource) => ({
              ...resource,
              ownership: creatorType,
            }),
          );

          let allExperiences: TargetPartWithCreatorType[] = userExperiences;

          // If creatorType is User, fetch from all groups
          if (creatorType === SearchCreatorType.User && groups && groups.length > 0) {
            const groupResponses = await Promise.allSettled(
              groups.map((group) =>
                getTargets({
                  creatorType: SearchCreatorType.Group,
                  creatorTargetId: group.id,
                  queryString: searchTerm,
                  limit: loadCount as V1SearchUniversesGetLimitEnum,
                  settings,
                }),
              ),
            );

            // Collect group resources with ownership
            const groupExperiences: TargetPartWithCreatorType[] = [];
            groupResponses.forEach((result) => {
              if (result.status === 'fulfilled' && result.value.data) {
                result.value.data.forEach((resource) => {
                  groupExperiences.push({ ...resource, ownership: SearchCreatorType.Group });
                });
              }
            });

            // Deduplicate by id, keeping user-owned when there's a conflict
            const uniqueMap = new Map<number | string, TargetPartWithCreatorType>();
            userExperiences.forEach((r) => {
              if (r.id) {
                uniqueMap.set(r.id, r);
              }
            });
            groupExperiences.forEach((r) => {
              if (r.id && !uniqueMap.has(r.id)) {
                uniqueMap.set(r.id, r);
              }
            });
            allExperiences = Array.from(uniqueMap.values());
          }

          setUniverseOptions(allExperiences);
          setErrorText('');
          if (!initialQueryMade) {
            setInitialQueryMade(true);
          }
        } catch (e) {
          const response = getResponseFromError(e);
          const responseBody = await response?.json();
          setErrorText(
            responseBody && responseBody.message
              ? responseBody.message
              : translate(
                  translationKeys?.autoCompleteKeys?.errorKey ?? 'Message.GenericSearchError',
                ),
          );
        }
        setLoading(false);
      }
    },
    [
      isCreatorTarget,
      creatorType,
      creatorTargetId,
      translate,
      inputVal,
      initialQueryMade,
      translationKeys,
      targetPartName,
      settings,
      groups,
    ],
  );

  const handleChange = useCallback(
    (event: React.SyntheticEvent<Element>, value: TargetPartMetadata | null) => {
      if (onChange) {
        if (value && typeof value.id !== 'undefined') {
          const id = String(value.id);
          const { name } = value;

          // For creator target, use TargetPartNames.Creator for caching
          const cacheTargetPartName = isCreatorTarget ? TargetPartNames.Creator : targetPartName;
          setResourceCache(cacheTargetPartName, id, {
            name,
          });
          onChange(id);

          if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
          }

          setInputVal('');
          setSelectedValue(null);
          if (!isCreatorTarget) {
            fetchData('');
          }
        }
      }
    },
    [onChange, setResourceCache, targetPartName, isCreatorTarget, fetchData],
  );

  useEffect(() => {
    if (!isCreatorTarget) {
      fetchData('');
    } else {
      setInitialQueryMade(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- we need to fetch with empty string on initial load
  }, [isCreatorTarget]);

  const handleInputChange = useCallback(
    (event: React.SyntheticEvent<Element>, value: string) => {
      setInputVal(value);

      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      if (!isCreatorTarget) {
        debounceTimeoutRef.current = setTimeout(() => {
          fetchData(value);
        }, 300);
      }
    },
    [fetchData, isCreatorTarget],
  );

  const noOptionsMessage = useMemo(() => {
    if (errorText !== '') {
      return errorText;
    }
    return initialQueryMade
      ? translate('Message.NoOptionsText')
      : translate('Message.UniverseSearchInstructions');
  }, [errorText, initialQueryMade, translate]);

  const isExperienceAlreadySelected = useCallback(
    (option: TargetPartWithCreatorType) => {
      return selectedIds.includes(String(option.id));
    },
    [selectedIds],
  );

  // Use creator options for creator target, otherwise use universe options
  // Cast to handle the union type (number | string IDs)
  const options: Array<TargetPartMetadata> = isCreatorTarget
    ? (filteredCreatorOptions as Array<TargetPartMetadata>)
    : universeOptions;

  // Group by ownership when creatorType is User and targetPartName is Universe
  const groupBy = useMemo(() => {
    if (creatorType === SearchCreatorType.User && targetPartName === TargetPartNames.Universe) {
      return (option: TargetPartWithCreatorType) =>
        option.ownership === SearchCreatorType.Group
          ? translate('Label.GroupOwnedExperiences')
          : translate('Label.UserOwnedExperiences');
    }
    return;
  }, [creatorType, targetPartName, translate]);

  return (
    <div className={className}>
      <Autocomplete
        data-testid='autocomplete'
        disabled={disabled}
        value={selectedValue}
        inputValue={inputVal}
        noOptionsText={noOptionsMessage}
        loadingText={translate(
          translationKeys?.autoCompleteKeys?.loadingTextKey ?? 'Message.GenericLoadingText',
        )}
        open={open}
        onOpen={handleOpen}
        onClose={handleClose}
        options={options}
        getOptionLabel={(option: TargetPartMetadata) => {
          return option.name ?? '';
        }}
        getOptionDisabled={isExperienceAlreadySelected}
        groupBy={groupBy}
        onChange={handleChange}
        onInputChange={handleInputChange}
        renderInput={(params) => (
          <TextField
            {...params}
            size='small'
            label=''
            error={errorText !== ''}
            placeholder={
              isCreatorTarget
                ? translate('Message.SearchCreatorsPlaceHolder')
                : translate(
                    translationKeys?.autoCompleteKeys?.searchPlaceholder ??
                      'Message.GenericSearchPlaceholder',
                  )
            }
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position='start'>
                  <SearchIcon />
                  {params.InputProps.startAdornment}
                </InputAdornment>
              ),
              endAdornment: (
                <>
                  {loading ? <CircularProgress size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
      />
    </div>
  );
};

export default TargetPartSearch;
