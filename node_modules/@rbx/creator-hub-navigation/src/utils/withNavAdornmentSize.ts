import React from 'react';

type TSizedAdornmentProps = {
  size?: string;
  label?: string;
  children?: React.ReactNode;
};

/**
 * Force Foundation Badge adornments in nav rails to XSmall.
 * Leaves legacy Chips (`size="small"|"medium"`) and non-badge nodes (icons) alone.
 * Walks wrappers (e.g. Tooltip) so nested badges still get sized.
 */
const withNavAdornmentSize = (adornment: React.ReactNode): React.ReactNode => {
  if (!React.isValidElement<TSizedAdornmentProps>(adornment)) {
    return adornment;
  }

  const { size, label, children } = adornment.props;

  if (typeof label === 'string') {
    // @rbx/ui Chip uses lowercase sizes — do not remap those.
    if (size === 'small' || size === 'medium') {
      return adornment;
    }
    // oxlint-disable-next-line react/no-clone-element -- adornments are opaque ReactNodes from callers; clone is required to inject size without an API change.
    return React.cloneElement(adornment, { size: 'XSmall' });
  }

  if (children == null) {
    return adornment;
  }

  // oxlint-disable-next-line react/no-clone-element -- walk wrapper trees (e.g. Tooltip) to size nested badges.
  return React.cloneElement(adornment, {
    children: React.Children.map(children, withNavAdornmentSize),
  });
};

export default withNavAdornmentSize;
