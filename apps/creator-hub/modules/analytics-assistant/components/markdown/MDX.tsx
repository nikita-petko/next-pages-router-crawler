import React, { useEffect, useState, ReactElement } from 'react';
import processor from '../../markdown/getMarkdownProcessor';

interface MDXProps {
  content?: string;
}

const MDX: React.FC<MDXProps> = ({ content }) => {
  const [processedContent, setProcessedContent] = useState<null | ReactElement>(null);

  useEffect(() => {
    if (content) {
      const processWithMarkdownProcess = async () => {
        const processed = await processor.process(content || '');
        setProcessedContent(processed.result as React.ReactElement);
      };
      processWithMarkdownProcess();
    }
  }, [content]);

  return processedContent;
};

export default MDX;
