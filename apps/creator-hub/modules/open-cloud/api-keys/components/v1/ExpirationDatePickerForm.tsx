import { useTranslation } from '@rbx/intl';
import { Grid, Typography, Tooltip, InfoOutlinedIcon } from '@rbx/ui';
import ExpirationDatePicker from './ExpirationDatePicker';
import useExpirationDatePickerFormStyles from './ExpirationDatePickerForm.styles';

interface ExpirationDatePickerFormProps {
  onChange?: (date: Date | null) => void;
  isExpired?: boolean;
  initialDate?: Date | null;
}

const ExpirationDatePickerForm = ({
  onChange,
  isExpired,
  initialDate,
}: ExpirationDatePickerFormProps) => {
  const {
    classes: { inputBlock, subHeading, datePicker, tooltip },
  } = useExpirationDatePickerFormStyles();
  const { translate } = useTranslation();

  return (
    <Grid
      classes={{ root: inputBlock }}
      container
      justifyContent='space-between'
      alignItems='center'>
      <Grid item XSmall={12} Medium={7}>
        <Typography component='div' className={subHeading} variant='h6' color='primary'>
          <Grid container alignItems='center'>
            {translate('Label.Expiration')}
            {isExpired && (
              <Tooltip
                arrow
                placement='top'
                title={translate('Message.APIKeyHasExpired')}
                data-testid='expiration-toolTip'>
                <InfoOutlinedIcon className={tooltip} />
              </Tooltip>
            )}
          </Grid>
        </Typography>
        <Typography variant='body1' color='primary'>
          {translate('Message.ExpirationDescription')}
        </Typography>
      </Grid>
      <Grid item XSmall={12} Medium={5}>
        <div className={datePicker}>
          <ExpirationDatePicker initialDate={initialDate} onChange={onChange} />
        </div>
      </Grid>
    </Grid>
  );
};

export default ExpirationDatePickerForm;
