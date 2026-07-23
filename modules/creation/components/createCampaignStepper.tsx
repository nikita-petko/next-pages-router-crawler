import { makeStyles, Step, StepLabel, Stepper } from '@rbx/ui';
import { useContext } from 'react';

import { CreateCampaignMetadataContext } from '@modules/creation/contexts/createCampaignPageContext';

interface CreateCampaignStepperProps {
  canSelectStep?: (stepIndex: number) => boolean;
  orientation?: 'horizontal' | 'vertical';
}

// TODO: Ad proper form controls
export const CreateCampaignStepper = ({
  canSelectStep,
  orientation = 'horizontal',
}: CreateCampaignStepperProps) => {
  const {
    classes: { stepHover, stepperRoot },
  } = makeStyles()((theme) => ({
    stepHover: {
      cursor: 'pointer',
    },

    stepperRoot: {
      backgroundColor: theme.palette.content.static.dark,
      marginLeft: '-9px',
      marginRight: '-8px',
      paddingRight: '0',
    },
  }))();
  const { activeStep, setActiveStep, steps = [] } = useContext(CreateCampaignMetadataContext);

  return (
    <Stepper activeStep={activeStep} classes={{ root: stepperRoot }} orientation={orientation}>
      {steps!.map((label, index) => (
        <Step
          className={stepHover}
          key={label}
          onClick={() => {
            if (canSelectStep?.(index)) {
              setActiveStep(index);
            }
          }}>
          <StepLabel>{label}</StepLabel>
        </Step>
      ))}
    </Stepper>
  );
};
