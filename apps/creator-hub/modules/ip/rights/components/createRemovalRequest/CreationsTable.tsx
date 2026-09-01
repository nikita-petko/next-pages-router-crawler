import type { FunctionComponent } from 'react';
import React, { useState } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  MoreVertIcon,
  Menu,
  MenuItem,
  EditOutlinedIcon,
  ListItemIcon,
  FileCopyOutlinedIcon,
  DeleteIcon,
  makeStyles,
  TableFooter,
  TablePagination,
} from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { UsePaginationActions, UsePaginationState } from '../../hooks/usePagination';
import type { TakedownRequest } from '../../types/types';
import ContentGrid from '../common/ContentGrid';
import TrademarkContentGrid from '../common/TrademarkContentGrid';
import ExpandableText from '../removalRequests/ExpandableText';
import FileDisplay from './FileDisplay';

interface CreationsTableProps {
  creations: TakedownRequest[];
  onDelete: (index: number) => void;
  onDuplicate: (index: number) => void;
  onEdit: (index: number) => void;
  pagination: UsePaginationState & UsePaginationActions;
}

interface ContentRowProps {
  creation: TakedownRequest;
  index: number;
  onDelete: (index: number) => void;
  onDuplicate: (index: number) => void;
  onEdit: (index: number) => void;
}

const useStyles = makeStyles()({
  creationsTable: {
    tableLayout: 'fixed',
  },
  claimItemDescription: {
    width: '23%',
  },
  claimItemActionCell: {
    width: '8%',
  },
});

const ContentRow: FunctionComponent<React.PropsWithChildren<ContentRowProps>> = ({
  creation,
  index,
  onDelete,
  onDuplicate,
  onEdit,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const { translate } = useTranslation();
  const isTrademark = creation.myContent?.myTrademarkContent !== undefined;

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const onDeleteEntry = () => {
    handleClose();
    onDelete(index);
  };

  const onDuplicateEntry = () => {
    handleClose();
    onDuplicate(index);
  };

  const onEditEntry = () => {
    handleClose();
    onEdit(index);
  };

  return (
    <TableRow key={creation.key}>
      <TableCell>
        <ContentGrid
          contentId={creation.infringingContent.contentId}
          contentType={creation.infringingContent.contentType}
          originalLink={creation.infringingContent.originalLink}
          sourceOfCreation={creation.creationSource}
        />
      </TableCell>
      <TableCell>
        {creation.myContent ? (
          creation.myContent.myTrademarkContent ? (
            <TrademarkContentGrid content={creation.myContent.myTrademarkContent} />
          ) : (
            <ContentGrid
              contentId={creation.myContent.contentId}
              contentType={creation.myContent.contentType}
              originalLink={creation.myContent.originalLink}
              sourceOfCreation={creation.creationSource}
              isMyCreation
            />
          )
        ) : (
          <Typography>{translate('Label.OriginalContentNotProvided')}</Typography>
        )}
      </TableCell>
      <TableCell>
        <ExpandableText>{creation.description}</ExpandableText>
      </TableCell>
      <TableCell>
        <FileDisplay docs={creation.supportingFiles} />
      </TableCell>
      <TableCell>
        <IconButton
          aria-label='action'
          color='secondary'
          size='medium'
          onClick={handleClick}
          data-testid='item-action-menu-button'>
          <MoreVertIcon />
        </IconButton>
        <Menu
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorEl={anchorEl}
          keepMounted
          open={!!anchorEl}
          onClose={handleClose}>
          {!isTrademark && (
            <MenuItem onClick={onEditEntry}>
              <ListItemIcon>
                <EditOutlinedIcon />
              </ListItemIcon>
              <Typography>{translate('Action.Edit')}</Typography>
            </MenuItem>
          )}
          {!isTrademark && (
            <MenuItem onClick={onDuplicateEntry}>
              <ListItemIcon>
                <FileCopyOutlinedIcon />
              </ListItemIcon>
              <Typography>{translate('Action.Duplicate')}</Typography>
            </MenuItem>
          )}
          <MenuItem onClick={onDeleteEntry}>
            <ListItemIcon>
              <DeleteIcon />
            </ListItemIcon>
            <Typography>{translate('Action.Delete')}</Typography>
          </MenuItem>
        </Menu>
      </TableCell>
    </TableRow>
  );
};

const CreationsTable: FunctionComponent<React.PropsWithChildren<CreationsTableProps>> = ({
  creations,
  onDelete,
  onDuplicate,
  onEdit,
  pagination,
}) => {
  const { ready, translate } = useTranslation();
  const {
    classes: { creationsTable, claimItemDescription, claimItemActionCell },
  } = useStyles();
  const { page, setPage, rowsPerPage, setRowsPerPage } = pagination;

  if (!ready) {
    return null;
  }

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  if (!creations || creations.length === 0) {
    return null;
  }
  const currentPageCreations = creations.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );
  const isTrademarkClaim = creations.some(
    (creation) => creation.myContent?.myTrademarkContent !== undefined,
  );

  const tableContents = currentPageCreations.map((creation, index) => {
    const globalIndex = page * rowsPerPage + index;
    return (
      <ContentRow
        creation={creation}
        index={globalIndex}
        key={creation.key}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        onEdit={onEdit}
      />
    );
  });

  return (
    <Table className={creationsTable}>
      <TableHead>
        <TableRow>
          <TableCell className={claimItemDescription}>
            {translate('Label.ReportedCreation')}
          </TableCell>
          <TableCell className={claimItemDescription}>
            {isTrademarkClaim ? translate('Label.MyTrademark') : translate('Label.MyCreation')}
          </TableCell>
          <TableCell className={claimItemDescription}>{translate('Label.Description')}</TableCell>
          <TableCell className={claimItemDescription}>
            {translate('Label.SupportingFiles')}
          </TableCell>
          <TableCell className={claimItemActionCell}>{translate('Label.Actions')}</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>{tableContents}</TableBody>
      <TableFooter>
        <TableRow>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            count={creations.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TableRow>
      </TableFooter>
    </Table>
  );
};

export default withTranslation(CreationsTable, [TranslationNamespace.RightsPortal]);
