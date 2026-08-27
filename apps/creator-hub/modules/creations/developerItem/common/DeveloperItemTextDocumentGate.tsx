import type { FunctionComponent } from 'react';
import React from 'react';
import { StatusCodes } from '@rbx/core';
import { CircularProgress } from '@rbx/ui';
import { Asset } from '@modules/miscellaneous/common';
import { EmptyGrid } from '@modules/miscellaneous/components';
import { ErrorPage } from '@modules/miscellaneous/error';
import useTextDocumentGate from '../../home/hooks/useTextDocumentGate';
import { useCurrentDeveloperItem } from './DeveloperItemProvider';

/**
 * Gates the developer-item routes (configure, permissions, version-history,
 * dependencies) for TextDocument assets. The creations tab is gated by
 * `useTextDocumentGate`, but the routes are reachable directly by URL, so a
 * user outside the flag allowlist could otherwise open a TextDocument page.
 * When the loaded asset is a TextDocument and the flag is off, render a 404.
 */
const DeveloperItemTextDocumentGate: FunctionComponent<React.PropsWithChildren> = ({
  children,
}) => {
  const { developerItemDetails } = useCurrentDeveloperItem();
  const isTextDocumentEnabled = useTextDocumentGate();

  if (developerItemDetails?.type === Asset.TextDocument) {
    // Flag not resolved yet: avoid flashing either the page or a 404.
    if (isTextDocumentEnabled === undefined) {
      return (
        <EmptyGrid>
          <CircularProgress />
        </EmptyGrid>
      );
    }
    if (!isTextDocumentEnabled) {
      return <ErrorPage errorCode={StatusCodes.NOT_FOUND} />;
    }
  }

  return <>{children}</>;
};

export default DeveloperItemTextDocumentGate;
