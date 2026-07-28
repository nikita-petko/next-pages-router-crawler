import { TextField } from '@mui/material';
import { IPContentStatusEnum, type IPContent } from '@rbx/client-rights/v1';
import { Autocomplete, makeStyles, Typography } from '@rbx/ui';

interface KeywordSelectorProps {
  keywords: IPContent[];
  currentKeyword?: IPContent;
  onChange: (keyword: IPContent | undefined) => void;
  placeholder: string;
  disabled?: boolean;
}

const useStyles = makeStyles()((theme) => ({
  // Default disabled autocomplete doesn't look good in dark mode.
  // Due to (presumably) a bug in MUI, when an autocomplete is disabled,
  // the usual border color opacity of 0.28 is not applied.
  // This causes disabled autocompletes to stand out visually
  // with a more distinct border compared to enabled autocompletes.
  // This style overrides the default to ensure that the border opacity is applied correctly.
  // We also add an opacity of 0.5 on top of this, to fade out the autocomplete a bit more.
  disabledAutocomplete: {
    fieldset: {
      borderColor:
        theme.palette.mode === 'dark'
          ? 'rgba(255, 255, 255, 0.28) !important'
          : 'rgba(0, 0, 0, 0.28) !important',
    },
    opacity: 0.5,
  },
}));

// The width of the keyword selector in pixels
const KEYWORD_SELECTOR_WIDTH = 220;

const KeywordSelector = ({
  keywords,
  currentKeyword,
  onChange,
  placeholder,
  disabled = false,
}: KeywordSelectorProps) => {
  const { classes } = useStyles();

  return (
    <Autocomplete
      sx={{ width: KEYWORD_SELECTOR_WIDTH }}
      value={currentKeyword ?? null}
      options={keywords}
      isOptionEqualToValue={(option, value) => option?.id === value?.id}
      getOptionKey={(content) => content?.id ?? ''}
      getOptionLabel={(content) => content?.contentValue ?? ''}
      getOptionDisabled={(content) => content.status !== IPContentStatusEnum.Approved}
      renderOption={(props, content) => {
        // The key type is unknown and depends on the implementation of the Autocomplete component. We just forward it.
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const { key, ...optionProps } = props;
        if (content.status !== IPContentStatusEnum.Approved) {
          return null;
        }
        return (
          // The key type is unknown and depends on the implementation of the Autocomplete component. We just forward it.
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          <li key={key} {...optionProps}>
            <Typography color='secondary' component='span' noWrap sx={{ flex: 1, minWidth: 0 }}>
              {content.contentValue ?? ''}
            </Typography>
          </li>
        );
      }}
      onChange={(event, value) => onChange(value ?? undefined)}
      renderInput={(params) => (
        <TextField
          {...params}
          size='small'
          placeholder={placeholder}
          variant='outlined'
          className={disabled ? classes.disabledAutocomplete : undefined}
        />
      )}
      disabled={disabled}
    />
  );
};

export default KeywordSelector;
