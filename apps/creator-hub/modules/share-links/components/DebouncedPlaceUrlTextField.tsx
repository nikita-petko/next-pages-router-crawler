import type { FunctionComponent } from 'react';
import { useState, useCallback, useRef } from 'react';
import { useTranslation } from '@rbx/intl';
import { CircularProgress, SearchIcon, InputAdornment, CancelIcon, makeStyles } from '@rbx/ui';
import DebouncedTextField from '@modules/charts-generic/charts/DebouncedTextField';
import gamesClient from '@modules/clients/games';
import type { TExperience } from '@modules/home/providers/ExperienceProvider';
import { SearchDebounceMilliseconds } from '../constants/shareLinkConstants';
import parseGameUrl from './parseGameUrl';

const useDebouncedPlaceUrlTextFieldStyles = makeStyles()((theme) => ({
  pointerIcon: {
    cursor: 'pointer',
    color: theme.palette.content.muted,
  },

  inputAdornments: {
    '&:first-child': {
      marginLeft: 8,
    },
    '& > *:not(:first-child)': {
      marginLeft: 10,
    },
  },

  helperText: {
    paddingLeft: 14,
    gridArea: 'helper',
  },
}));

export interface DebouncedPlaceUrlTextFieldProps {
  setExperience: (value?: TExperience) => void;
  getUniverseId: (placeId: number) => Promise<number | null>;
  defaultValue?: string;
  setError?: (error?: string) => void;
  error?: boolean;
}

const DebouncedPlaceUrlTextField: FunctionComponent<DebouncedPlaceUrlTextFieldProps> = ({
  setExperience,
  getUniverseId,
  defaultValue,
  setError,
  error,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const {
    classes: { pointerIcon, inputAdornments },
  } = useDebouncedPlaceUrlTextFieldStyles();

  const { translate } = useTranslation();

  const [loading, setLoading] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>(defaultValue || '');

  const cacheRef = useRef<{ [key: number]: TExperience }>({});

  const validateUrl = useCallback(
    async (placeUrl: string) => {
      if (!placeUrl || placeUrl.length === 0) {
        setExperience(undefined);
        setError?.(undefined);
        return;
      }

      try {
        const parsedPlaceId = parseGameUrl(placeUrl);
        if (!parsedPlaceId) {
          setExperience(undefined);
          setError?.(translate('Label.InvalidExperienceUrl'));
          return;
        }

        if (cacheRef.current[parsedPlaceId]) {
          setExperience(cacheRef.current[parsedPlaceId]);
          setError?.(undefined);
          return;
        }

        setLoading(true);

        const uId = await getUniverseId(parsedPlaceId);

        if (!uId) {
          setExperience(undefined);
          setError?.(translate('Label.InvalidExperienceUrl'));
          return;
        }

        const gameDetailsResponse = await gamesClient.getDetails([uId]);
        if (gameDetailsResponse.data === undefined || gameDetailsResponse?.data?.length === 0) {
          setExperience(undefined);
          setError?.(translate('Label.InvalidExperienceUrl'));
          return;
        }

        const gameDetailsAsExperience = gameDetailsResponse.data[0] as TExperience;
        cacheRef.current[parsedPlaceId] = gameDetailsAsExperience;
        setExperience(gameDetailsAsExperience);
        setError?.(undefined);
      } catch {
        setExperience(undefined);
        setError?.(translate('Label.InvalidExperienceUrl'));
      } finally {
        setLoading(false);
      }
    },
    [getUniverseId, setError, setExperience, translate],
  );

  const onDebouncedChange = useCallback(
    (input: string) => {
      setInputValue(input);
      validateUrl(input.trim());
    },
    [validateUrl],
  );

  return (
    <DebouncedTextField
      fullWidth
      value={inputValue}
      size='small'
      onDebouncedChange={onDebouncedChange}
      debounceTime={SearchDebounceMilliseconds}
      error={error}
      label={translate('Label.ExperienceUrlOptional')}
      id='experience-url'
      data-testid='experience-url'
      placeholder={translate('Label.ExperienceUrlPlaceHolder')}
      margin='dense'
      type='text'
      InputProps={{
        startAdornment: (
          <InputAdornment position='start' className={inputAdornments}>
            <SearchIcon />
          </InputAdornment>
        ),
        endAdornment: (
          <InputAdornment position='start'>
            {loading ? <CircularProgress color='secondary' size={20} /> : null}
            {!loading && inputValue.length > 0 && (
              <CancelIcon
                fontSize='small'
                onClick={() => onDebouncedChange('')}
                className={pointerIcon}
              />
            )}
          </InputAdornment>
        ),
        ref: searchInputRef,
      }}
    />
  );
};

export default DebouncedPlaceUrlTextField;
