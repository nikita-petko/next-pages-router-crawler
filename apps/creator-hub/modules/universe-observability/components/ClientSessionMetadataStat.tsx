import type { FC, ReactNode } from 'react';
import { Card } from '@rbx/foundation-ui';

// Match the experiment details summary tiles: size each tile to its content and
// wrap without stretching it, while keeping metadata rows visually aligned.
export const CLIENT_SESSION_METADATA_STAT_CONTAINER_CLASS_NAME =
  'width-fit max-width-full height-2300 shrink-0';

type ClientSessionMetadataStatProps = {
  readonly label: string;
  readonly children: ReactNode;
};

/**
 * Compact metadata tile rendering a single labeled value for a client session
 * (for example "Average FPS" / "54.5"). Multiple tiles wrap within the client
 * session details Metadata section.
 */
const ClientSessionMetadataStat: FC<ClientSessionMetadataStatProps> = ({ label, children }) => (
  <div className={CLIENT_SESSION_METADATA_STAT_CONTAINER_CLASS_NAME}>
    <Card variant='Emphasis' className='height-full' eyebrow={label} title={children} />
  </div>
);

export default ClientSessionMetadataStat;
