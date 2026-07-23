import { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import LuobuCashOutContainer from '@modules/devex/luobu/cashOut/components/CashOut';
import { ErrorPage } from '@modules/miscellaneous/error';
import { StatusCodes } from '@rbx/core';
import IALayoutExperiment from '@modules/creator-hub-layout/IALayoutExperiment';

const getCashOutPageLayout = (page: ReactNode) => (
  <IALayoutExperiment title='Heading.DevEx'>{page}</IALayoutExperiment>
);

const CashOut: NextLayoutPage = () => {
  if (process.env.buildTarget === 'luobu') {
    return (
      <Authenticated>
        <LuobuCashOutContainer />
      </Authenticated>
    );
  }
  return <ErrorPage errorCode={StatusCodes.NOT_FOUND} />;
};

CashOut.getPageLayout = getCashOutPageLayout;

export default CashOut;
