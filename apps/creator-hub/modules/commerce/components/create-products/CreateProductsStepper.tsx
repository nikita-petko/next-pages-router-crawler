import { Grid, Step, StepLabel, Stepper, Typography } from '@rbx/ui';
import React, { FunctionComponent } from 'react';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useTranslation, withTranslation } from '@rbx/intl';

interface CreateProductStepperProps {
  activeStep: number;
}

const CreateProductsStepper: FunctionComponent<CreateProductStepperProps> = ({ activeStep }) => {
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
