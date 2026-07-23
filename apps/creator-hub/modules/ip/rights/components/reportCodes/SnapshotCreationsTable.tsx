import type { FunctionComponent } from 'react';
import React, { useState } from 'react';
import { ClaimContentContentTypeEnum, ClaimItemSourceEnum } from '@rbx/client-rights/v1';
import type { SnapshotContent } from '@rbx/client-rights/v1';
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
  ListItemIcon,
  DeleteIcon,
  TableFooter,
  TablePagination,
} from '@rbx/ui';
import type { Doc } from '@modules/miscellaneous/components/uploaders/components/MultiDocumentUploader/MultiDocumentUploader';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { OriginalContent } from '../../helpers/parseOriginalContent';
import type { UsePaginationActions, UsePaginationState } from '../../hooks/usePagination';
import ContentGrid from '../common/ContentGrid';
import FileDisplay from '../createRemovalRequest/FileDisplay';
import ExpandableText from '../removalRequests/ExpandableText';
import SnapshotContentGridTile from './SnapshotContentGrid';
import getSnapshotContentKey from './snapshotContentKeyUtils';

interface CreationsTableProps {
  items: SnapshotContent[];
  rootPlaceId?: number;
  originalContent: OriginalContent | null;
  description: string;
  documents: Doc[];
  isClaim?: boolean;
  onDelete: (index: number) => void;
  pagination: UsePaginationState & UsePaginationActions;
}

interface ContentRowProps {
  item: SnapshotContent;
  originalContent: OriginalContent | null;
  description: string;
  documents: Doc[];
  index: number;
  onDelete: (index: number) => void;
}

const ContentRow: FunctionComponent<React.PropsWithChildren<ContentRowProps>> = ({
  item,
  originalContent,
  description,
  documents,
  index,
  onDelete,
}) => {
  const { translate } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <TableRow key={getSnapshotContentKey(item)}>
      <TableCell>
        <SnapshotContentGridTile item={item} />
      </TableCell>
      <TableCell>
        {originalContent ? (
          <ContentGrid
            contentId={originalContent.contentId}
            contentType={originalContent.contentType}
            originalLink={originalContent.originalLink}
            sourceOfCreation={ClaimItemSourceEnum.OnRoblox}
            isMyCreation
          />
        ) : (
          <Typography>{translate('Label.OriginalContentNotProvided')}</Typography>
        )}
      </TableCell>
      <TableCell>
        <ExpandableText>{description}</ExpandableText>
      </TableCell>
      <TableCell>
        <FileDisplay docs={documents} />
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
          <MenuItem
            onClick={() => {
              handleClose();
              onDelete(index);
            }}>
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

interface ExperienceRootTableProps {
  rootPlaceId: number;
  originalContent: OriginalContent | null;
  description: string;
  documents: Doc[];
  isClaim?: boolean;
}

const ExperienceRootTable: FunctionComponent<ExperienceRootTableProps> = ({
  rootPlaceId,
  originalContent,
  description,
  documents,
  isClaim,
}) => {
  const { translate } = useTranslation();
  return (
    <Table sx={{ tableLayout: 'fixed' }}>
      <TableHead>
        <TableRow>
          <TableCell sx={{ width: '25%' }}>
            {translate(isClaim ? 'Label.ClaimedCreation' : 'Label.ReportedCreation')}
          </TableCell>
          <TableCell sx={{ width: '25%' }}>{translate('Label.MyCreation')}</TableCell>
          <TableCell sx={{ width: '25%' }}>{translate('Label.Description')}</TableCell>
          <TableCell sx={{ width: '25%' }}>{translate('Label.SupportingFiles')}</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        <TableRow>
          <TableCell>
            <ContentGrid contentId={rootPlaceId} contentType={ClaimContentContentTypeEnum.Asset} />
          </TableCell>
          <TableCell>
            {originalContent ? (
              <ContentGrid
                contentId={originalContent.contentId}
                contentType={originalContent.contentType}
                originalLink={originalContent.originalLink}
                sourceOfCreation={ClaimItemSourceEnum.OnRoblox}
                isMyCreation
              />
            ) : (
              <Typography>{translate('Label.OriginalContentNotProvided')}</Typography>
            )}
          </TableCell>
          <TableCell>
            <ExpandableText>{description}</ExpandableText>
          </TableCell>
          <TableCell>
            <FileDisplay docs={documents} />
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
};

// Requires TranslationNamespace.RightsPortal provider
const SnapshotCreationsTable: FunctionComponent<React.PropsWithChildren<CreationsTableProps>> = ({
  items,
  rootPlaceId,
  originalContent,
  description,
  documents,
  isClaim,
  onDelete,
  pagination,
}) => {
  const { ready, translate } = useTranslation();
  const { page, setPage, rowsPerPage, setRowsPerPage } = pagination;

  if (!ready) {
    return null;
  }

  if (rootPlaceId) {
    return (
      <ExperienceRootTable
        rootPlaceId={rootPlaceId}
        originalContent={originalContent}
        description={description}
        documents={documents}
        isClaim={isClaim}
      />
    );
  }

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (!items || items.length === 0) {
    return null;
  }

  const currentPageItems = items.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const tableContents = currentPageItems.map((item, index) => {
    const globalIndex = page * rowsPerPage + index;
    return (
      <ContentRow
        item={item}
        originalContent={originalContent}
        description={description}
        documents={documents}
        index={globalIndex}
        key={getSnapshotContentKey(item)}
        onDelete={onDelete}
      />
    );
  });

  return (
    <Table sx={{ tableLayout: 'fixed' }}>
      <TableHead>
        <TableRow>
          <TableCell sx={{ width: '23%' }}>
            {translate(isClaim ? 'Label.ClaimedCreation' : 'Label.ReportedCreation')}
          </TableCell>
          <TableCell sx={{ width: '23%' }}>{translate('Label.MyCreation')}</TableCell>
          <TableCell sx={{ width: '23%' }}>{translate('Label.Description')}</TableCell>
          <TableCell sx={{ width: '23%' }}>{translate('Label.SupportingFiles')}</TableCell>
          <TableCell sx={{ width: '8%' }}>{translate('Label.Actions')}</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>{tableContents}</TableBody>
      <TableFooter>
        <TableRow>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            count={items.length}
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

export default withTranslation(SnapshotCreationsTable, [TranslationNamespace.RightsPortal]);
