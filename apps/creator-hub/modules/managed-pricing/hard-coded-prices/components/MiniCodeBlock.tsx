import { memo } from 'react';
import { clsx } from '@rbx/foundation-ui';

type Props = {
  code: string;
  className?: string;
};

const codeBlockStyle = {
  fontFamily: 'monospace',
  border: '1px solid var(--Components-Divider, rgba(255, 255, 255, 0.12))',
};

function MiniCodeBlock({ code, className }: Props) {
  return (
    <code
      className={clsx(
        'bg-surface-300 padding-y-xxsmall padding-x-xsmall radius-small',
        'content-muted text-body-small overflow-hidden truncate block',
        className,
      )}
      style={codeBlockStyle}
      title={code}>
      {code}
    </code>
  );
}

export default memo(MiniCodeBlock);
