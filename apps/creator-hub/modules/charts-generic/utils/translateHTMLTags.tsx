import React from 'react';

export const ListTag = {
  opening: 'listStart',
  closing: 'listEnd',
  content(chunks: React.ReactNode) {
    return <ul>{chunks}</ul>;
  },
};

export const ListItemTag = {
  opening: 'listItemStart',
  closing: 'listItemEnd',
  content(chunks: React.ReactNode) {
    return <li>{chunks}</li>;
  },
};

export const BoldTag = {
  opening: 'boldStart',
  closing: 'boldEnd',
  content(chunks: React.ReactNode) {
    return <b>{chunks}</b>;
  },
};
