import type { FunctionComponent } from 'react';
import React, { useState } from 'react';
import { useTranslation } from '@rbx/intl';
import type { HelpInfo } from '@modules/clients/experienceQuestionnaire';
import HelpDialog from './HelpDialog';

interface AnswerHelpButtonProps {
  helpInfo: HelpInfo;
}

const hasContent = (helpInfo: HelpInfo): boolean =>
  !!(helpInfo.title || helpInfo.text || (helpInfo.examples && helpInfo.examples.length > 0));

const AnswerHelpButton: FunctionComponent<AnswerHelpButtonProps> = ({ helpInfo }) => {
  const { translate } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (!hasContent(helpInfo)) {
    return null;
  }

  return (
    <>
      <button
        className='text-body-medium content-default cursor-pointer padding-[0px]'
        style={{
          background: 'none',
          border: 'none',
          textDecoration: 'underline',
          marginLeft: 'calc(var(--size-600) + var(--gap-medium))',
        }}
        onClick={(event) => {
          event.preventDefault();
          setIsDialogOpen(true);
        }}
        type='button'>
        {translate('Label.ViewDetails')}
      </button>
      <HelpDialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} helpInfo={helpInfo} />
    </>
  );
};

export default AnswerHelpButton;
