import React, { useMemo } from 'react';
import customComponents, { CustomComponentNames } from '../../markdown/constants/customComponents';
import { createMarkdownProcessor } from '../../markdown/getMarkdownProcessor';

const processor = createMarkdownProcessor({
  components: customComponents,
  names: CustomComponentNames,
  attributes: {
    recommendations: [['recs']],
    newsignal: [['count'], ['text']],
  },
});

interface MDXProps {
  content?: string;
}

const MDX: React.FC<MDXProps> = ({ content }) => {
  return useMemo(() => {
    if (!content) {
      return null;
    }
    const rendered = processor.processSync(content).result;
    return <>{rendered}</>;
  }, [content]);
};

export default MDX;
