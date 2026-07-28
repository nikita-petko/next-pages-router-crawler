import { memo } from 'react';
import { clsx } from '@rbx/foundation-ui';

type Props = {
  code: string;
  className?: string;
};

function MiniCodeBlock({ code, className }: Props) {
  return (
    <code
      className={clsx(
        'block padding-y-xxsmall padding-x-xsmall radius-small',
        'content-muted text-body-small overflow-hidden truncate [font-family:monospace]',
        className,
      )}
      title={code}>
      {code}
    </code>
  );
}

export default memo(MiniCodeBlock);
