// Communicates the current named revenue share wizard step through a labeled Foundation Stepper with accessible step state.
import type { FunctionComponent } from 'react';
import { Stepper, type TStepperProps } from '@rbx/foundation-ui';

type RevShareWizardStepProps = {
  steps: TStepperProps['steps'];
  currentStepIndex: number;
  'aria-label': string;
};

const RevShareWizardStep: FunctionComponent<RevShareWizardStepProps> = ({
  steps,
  currentStepIndex,
  'aria-label': ariaLabel,
}) => (
  <Stepper
    steps={steps}
    currentStepIndex={currentStepIndex}
    size='Medium'
    borderPosition='Bottom'
    aria-label={ariaLabel}
  />
);

export default RevShareWizardStep;
