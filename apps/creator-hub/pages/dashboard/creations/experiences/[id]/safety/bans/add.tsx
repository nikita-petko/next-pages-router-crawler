import React from 'react';
import type { NextLayoutPage } from 'next';
import AddUsersToBanContainer from '@modules/safety-controls/components/AddUsersToBanContainer';
import getUserBansPageLayout from '@modules/safety-controls/layout/GetUserBansPageLayout';

const UserBans: NextLayoutPage = () => {
  return <AddUsersToBanContainer />;
};

UserBans.getPageLayout = getUserBansPageLayout;

export default UserBans;
