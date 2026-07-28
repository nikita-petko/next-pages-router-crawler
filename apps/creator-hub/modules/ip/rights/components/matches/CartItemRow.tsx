import { CloseIcon, IconButton, Typography } from '@rbx/ui';
import type Match from './Match';
import SmallContentThumbnail from './SmallContentThumbnail';

// Compact row showing a cart item's thumbnail, name, and creator with a remove button.
// Used inside ArchiveMatchesDialog to list selected matches before submission.
const CartItemRow = ({ match, onRemove }: { match: Match; onRemove: (item: Match) => void }) => (
  <div
    key={`${match.searchContent.contentId}${match.searchContent.contentType}`}
    style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <div style={{ flexShrink: 0 }}>
      <SmallContentThumbnail content={match.searchContent} />
    </div>
    <div
      style={{
        overflow: 'hidden',
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
      }}>
      <Typography
        variant='body2'
        sx={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
        {match.searchContent.contentName}
      </Typography>
      <Typography variant='caption' color='secondary' sx={{ display: 'block' }}>
        {`@${match.searchContent.creator?.displayName}`}
      </Typography>
    </div>
    <IconButton
      aria-label='Remove'
      size='small'
      onClick={() => onRemove(match)}
      sx={{ '&:hover': { backgroundColor: 'action.hover' } }}>
      <CloseIcon fontSize='small' color='secondary' />
    </IconButton>
  </div>
);

export default CartItemRow;
