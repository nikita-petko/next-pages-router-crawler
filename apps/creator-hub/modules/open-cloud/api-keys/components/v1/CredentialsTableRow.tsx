import { useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import {
  TableCell,
  TableRow,
  Button,
  Typography,
  EditOutlinedIcon,
  DeleteOutlinedIcon,
  FileCopyIcon,
} from '@rbx/ui';
import type { CloudAuthInfo } from '@modules/clients/cloudAuthentication';
import parseCloudAuthInfo from '../../utils/parseCloudAuthInfo';
import useCredentialsTableRowStyles from './CredentialsTableRow.styles';

interface CredentialsTableRowProps {
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
  removeItemAtIndex: (index: number) => void;
  index: number;
  cloudAuthInfo?: CloudAuthInfo;
}

const CredentialsTableRow = ({
  onEdit,
  onDuplicate,
  removeItemAtIndex,
  index,
  cloudAuthInfo,
}: CredentialsTableRowProps) => {
  const {
    classes: { nameColumn, actionsCell },
  } = useCredentialsTableRowStyles();
  const { translate } = useTranslation();

  const {
    id,
    createdTime,
    updatedTime,
    cloudAuthBadStatus,
    apikeySecretPreview,
    cloudAuthUserConfiguredProperties: { isEnabled },
  } = useMemo(() => {
    return parseCloudAuthInfo(cloudAuthInfo);
  }, [cloudAuthInfo]);

  const onDuplicateClicked = () => {
    onDuplicate(id);
  };

  const onEditClicked = () => {
    onEdit(id);
  };

  const onDeleteClicked = () => {
    removeItemAtIndex(index);
  };

  return (
    <TableRow>
      <TableCell align='left' className={nameColumn}>
        {cloudAuthInfo?.cloudAuthUserConfiguredProperties?.name}
      </TableCell>
      <TableCell align='left'>
        {apikeySecretPreview !== '' && `${apikeySecretPreview}...`}
      </TableCell>
      <TableCell align='left'>
        <Typography color={isEnabled && cloudAuthBadStatus.length === 0 ? 'success' : 'error'}>
          {isEnabled && cloudAuthBadStatus.length === 0
            ? translate('Label.Active')
            : translate('Label.Inactive')}
        </Typography>
      </TableCell>
      <TableCell align='left'>{createdTime && createdTime.toLocaleString()}</TableCell>
      <TableCell align='left'>{updatedTime && updatedTime.toLocaleString()}</TableCell>
      <TableCell className={actionsCell}>
        <Button
          variant='text'
          color='primary'
          onClick={onEditClicked}
          startIcon={<EditOutlinedIcon />}>
          <Typography variant='buttonMedium'>{translate('Label.OAuthEdit')}</Typography>
        </Button>
        <Button
          variant='text'
          color='primary'
          onClick={onDuplicateClicked}
          startIcon={<FileCopyIcon />}>
          <Typography variant='buttonMedium'>{translate('Label.Duplicate')}</Typography>
        </Button>
        <Button
          variant='text'
          color='primary'
          onClick={onDeleteClicked}
          startIcon={<DeleteOutlinedIcon />}>
          <Typography variant='buttonMedium'>{translate('Action.Delete')}</Typography>
        </Button>
      </TableCell>
    </TableRow>
  );
};

export default CredentialsTableRow;
