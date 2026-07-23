import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import { getCreationsPageLayout, ConfigureContainer } from '@modules/creations';
import { SnackbarProvider } from '@rbx/ui';

const Configure: NextLayoutPage = () => {
  return (
    <Authenticated>
      <SnackbarProvider>
        <ConfigureContainer />
      </SnackbarProvider>
    </Authenticated>
  );
};

Configure.getPageLayout = (page) =>
  getCreationsPageLayout(page, { title: 'Heading.ContentSettings' });

export default Configure;
