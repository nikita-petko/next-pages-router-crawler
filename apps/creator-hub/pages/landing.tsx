import React from 'react';
import { NextLayoutPage } from 'next';
import { UIThemeProvider } from '@rbx/ui';
import LandingV2 from '@modules/landing/landing/components/LandingV2';

const Landing: NextLayoutPage = () => {
  return (
    <UIThemeProvider theme='dark'>
      <LandingV2 />
    </UIThemeProvider>
  );
};

export default Landing;
