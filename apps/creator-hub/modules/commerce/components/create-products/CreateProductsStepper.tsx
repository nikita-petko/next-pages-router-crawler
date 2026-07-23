import { useTranslation, withTranslation } from '@rbx/intl';
import { Grid, Step, StepLabel, Stepper, Typography } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

interface CreateProductStepperProps {
  activeStep: number;
}

const CreateProductsStepper = ({ activeStep }: CreateProductStepperProps) => {
  const { translate } = useTranslation();

  return (
    <Grid item>
      <Stepper activeStep={activeStep} orientation='horizontal'>
        <Step>
          <StepLabel>
            <Typography>{translate('Heading.CatalogItems')}</Typography>
          </StepLabel>
        </Step>
        <Step>
          <StepLabel>
            <Typography>{translate('Heading.ProductConfiguration')}</Typography>
          </StepLabel>
        </Step>
      </Stepper>
    </Grid>
  );
};
export default withTranslation(CreateProductsStepper, [TranslationNamespace.Commerce]);
