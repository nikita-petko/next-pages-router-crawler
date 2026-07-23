import React, { useCallback } from 'react';
import { Button } from '@rbx/foundation-ui';
import { useMediaQuery } from '@rbx/ui';
import { PROGRAMS_SECTION_ID } from './Programs';

export default function ApplyButton() {
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('Small'));
  const onClick = useCallback(() => {
    document.getElementById(PROGRAMS_SECTION_ID)?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <Button
      className='margin-top-[16px] shrink-0'
      size={isMobile ? 'Small' : 'Medium'}
      onClick={onClick}>
      Apply
    </Button>
  );
}
