import type { FunctionComponent } from 'react';
import React from 'react';
import { Dialog, DialogTemplate, Typography } from '@rbx/ui';
import { CreatorEligibility } from '@modules/clients/experienceGuidelinesService';
import useCreatorEligibility from '../hooks/useCreatorEligibility';

export interface BlockedDialogProps {
  creatorEligibility: CreatorEligibility;
}

// UCS-1342: Localization for this component will come as a fast-follow post-launch due to leakage of translation strings.
const BlockedDialog: FunctionComponent<React.PropsWithChildren<BlockedDialogProps>> = ({
  creatorEligibility,
  children,
}) => {
  const { toggleDialog, onConfirmButton, isDialogOpen } = useCreatorEligibility();

  const upsellDialogTemplate = (
    <DialogTemplate
      cancelText='Cancel'
      color='primaryBrand'
      confirmText='Verify My Age'
      content={
        <div>
          <Typography>Verify your age to access this experience.</Typography>
          <ol>
            <li>Go to Account Info &gt; Verify My Age</li>
            <li>Complete the verification process</li>
          </ol>
        </div>
      }
      onCancel={(e) => e.preventDefault()}
      onConfirm={(e) => onConfirmButton(e, true)}
      title='Age Verification Required'
      variant='alert'
    />
  );

  const blockedDialogTemplate = (
    <DialogTemplate
      cancelText='Cancel'
      color='primaryBrand'
      confirmText='OK'
      content='This experience is not accessible due to age restrictions.'
      onCancel={(e) => e.preventDefault()}
      onConfirm={(e) => onConfirmButton(e)}
      title='Age Restricted'
      variant='alert'
    />
  );

  return (
    <div
      onClick={(e) => toggleDialog(e)}
      role='button'
      onKeyPress={(e) => toggleDialog(e)}
      tabIndex={0}>
      {children}
      <Dialog onClose={() => toggleDialog()} open={isDialogOpen}>
        {creatorEligibility === CreatorEligibility.NotEligibleUpsell
          ? upsellDialogTemplate
          : blockedDialogTemplate}
      </Dialog>
    </div>
  );
};

export default BlockedDialog;
