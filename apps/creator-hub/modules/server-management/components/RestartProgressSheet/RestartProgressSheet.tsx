import type { FunctionComponent } from 'react';
import type { RestartStatus } from '@rbx/client-server-management-service/v1';
import { SheetBody, SheetContent, SheetRoot, SheetTitle } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import RestartFilterDetails from '../RestartFilterDetails/RestartFilterDetails';
import RestartProgress from '../RestartProgress/RestartProgress';
import useRestartProgressSheetStyles from './RestartProgressSheet.styles';

export interface RestartProgressSheetProps {
  onOpenChange: (open: boolean) => void;
  update: RestartStatus;
  open?: boolean;
}

const RestartProgressSheet: FunctionComponent<RestartProgressSheetProps> = ({
  onOpenChange,
  update,
  open,
}) => {
  const { translate } = useTranslation();
  const { classes } = useRestartProgressSheetStyles();

  const { sheetContent, sheetBody } = classes;

  return (
    <SheetRoot onOpenChange={onOpenChange} open={open}>
      <SheetContent largeScreenVariant='side' className={sheetContent}>
        <SheetTitle>{translate('RestartProgressSheet.Title')}</SheetTitle>
        <SheetBody className={sheetBody}>
          <RestartFilterDetails update={update} />
          <RestartProgress update={update} />
        </SheetBody>
      </SheetContent>
    </SheetRoot>
  );
};

export default RestartProgressSheet;
