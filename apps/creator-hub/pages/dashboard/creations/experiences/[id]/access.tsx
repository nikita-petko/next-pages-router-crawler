import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import { getCreationsPageLayout } from '@modules/creations';
import { SnackbarProvider } from '@rbx/ui';
/*
 * NOTE(lucaswang 02-15-2023): Part of the task https://roblox.atlassian.net/browse/DSA-900
 * which introduces a new eslint rule to disallow importing private components from other modules.
 * Should refactor to export private component in the corresponding module's index.ts.
 */
// eslint-disable-next-line no-restricted-imports -- see above
import ExperienceAccessContainer from '@modules/creations/access/containers/ExperienceAccessContainer';

const Access: NextLayoutPage = () => {
  return (
    <Authenticated>
      <SnackbarProvider>
        <ExperienceAccessContainer />
      </SnackbarProvider>
    </Authenticated>
  );
};

Access.getPageLayout = (page) => getCreationsPageLayout(page, { title: 'Heading.Access' });

export default Access;
