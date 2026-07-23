import { ReactElement } from 'react';

import CueEducationalCallout from '@components/common/CueEducationalCallout';
import DismissibleTooltip from '@components/common/DismissibleTooltip';
import {
  useCueMigrationBackfill,
  useCueMigrationCueingEnabled,
  useCueMigrationDismissHandler,
  useCueMigrationMetadataReady,
} from '@cueMigrations/useCueMigration';
import type { CueMigrationDefinition } from '@type/cueing';
import { shouldHideCueMigrationInBrowser } from '@utils/cueMigration';

type CueMigrationWrapperProps = {
  anchorElement: ReactElement;
  migration: CueMigrationDefinition;
};

const CueMigrationWrapper = ({ anchorElement, migration }: CueMigrationWrapperProps) => {
  const isMetadataReady = useCueMigrationMetadataReady();
  const isCueingEnabled = useCueMigrationCueingEnabled(migration);
  const dismissHandler = useCueMigrationDismissHandler(migration);

  useCueMigrationBackfill(migration, isMetadataReady && isCueingEnabled);

  if (!isMetadataReady) {
    return anchorElement;
  }

  if (!isCueingEnabled) {
    return <DismissibleTooltip anchorElement={anchorElement} tooltip={migration.tooltip} />;
  }

  if (shouldHideCueMigrationInBrowser(migration)) {
    return anchorElement;
  }

  return (
    <CueEducationalCallout
      anchorElement={anchorElement}
      dismissHandler={dismissHandler}
      modalId={migration.modalId}
      tooltip={migration.tooltip}
    />
  );
};

export default CueMigrationWrapper;
