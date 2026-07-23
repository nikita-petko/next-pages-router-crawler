import React from 'react';
import { TLink } from '../constants/type';
import FooterGrid from '../FooterGrid';

export default function formatGridComponent(item: { title: string; linkList: TLink[] }) {
  return <FooterGrid key={item.title} header={item.title} linkList={item.linkList} />;
}
