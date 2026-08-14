/* istanbul ignore file */

import type { FunctionComponent } from 'react';
import { useCallback, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { Button, Grid } from '@rbx/ui';
import CreateFolderDialog from './CreateFolderDialog';

export interface CreateFolderButtonProps {
  selectedFolderId: string;
  selectedFolderName?: string;
  onFolderCreated: (folderId: string) => void;
  onFolderUpdated: (folderId: string) => void;
  onFolderContentsUpdated: () => void;
  groupId?: number;
}

const CreateFolderButton: FunctionComponent<CreateFolderButtonProps> = ({
  selectedFolderId,
  selectedFolderName,
  onFolderCreated,
  onFolderUpdated,
  onFolderContentsUpdated,
  groupId,
}) => {
  const { translate } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const isRenameMode = !!selectedFolderId;

  const handleFolderRenamed = useCallback(
    (folderId: string) => {
      onFolderContentsUpdated();
      onFolderUpdated(folderId);
    },
    [onFolderContentsUpdated, onFolderUpdated],
  );

  return (
    <>
      <Grid item>
        <Button
          variant={isRenameMode ? 'outlined' : 'contained'}
          size='large'
          onClick={() => setIsDialogOpen(true)}>
          {isRenameMode ? translate('Action.RenameFolder') : translate('Action.CreateFolder')}
        </Button>
      </Grid>
      {isDialogOpen && (
        <CreateFolderDialog
          open
          onClose={() => setIsDialogOpen(false)}
          groupId={groupId}
          folderId={selectedFolderId || undefined}
          initialName={isRenameMode ? selectedFolderName : undefined}
          onFolderCreated={onFolderCreated}
          onFolderRenamed={handleFolderRenamed}
        />
      )}
    </>
  );
};

export default CreateFolderButton;
