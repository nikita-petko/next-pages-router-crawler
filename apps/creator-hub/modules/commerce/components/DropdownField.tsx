import { useTranslation, withTranslation } from '@rbx/intl';
import { Select, MenuItem } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

type Size = 'small' | 'medium';

interface DropdownInputs {
  selectionValue: string;
  label: string;
  listOfInputs: string[];
  handleChange: (arg: React.ChangeEvent<{ value: string }>) => void;
  disabled?: boolean;
  size?: Size;
}

const DropdownField = ({
  selectionValue,
  label,
  listOfInputs,
  handleChange,
  disabled,
  size,
}: DropdownInputs) => {
  const { translate } = useTranslation();
  return (
    <Select
      sx={{ minWidth: { xs: '279px', sm: '100%' }, mb: 2 }}
      label={label}
      margin='none'
      size={size ?? 'medium'}
      variant='outlined'
      required
      disabled={disabled}
      value={selectionValue}
      onChange={handleChange}>
      {listOfInputs.map((type) => {
        return (
          <MenuItem key={type} value={type}>
            {translate(`${type}`)}
          </MenuItem>
        );
      })}
    </Select>
  );
};

export default withTranslation(DropdownField, [
  TranslationNamespace.Commerce,
  TranslationNamespace.AssetTypes,
  TranslationNamespace.Creations,
]);
