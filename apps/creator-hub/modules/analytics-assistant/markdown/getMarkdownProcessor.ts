// Credit: https://github.rbx.com/Roblox/creator-doc-site/tree/master/services/doc-site-ssr/app/modules/markdownProcessor
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGFM from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeReact from 'rehype-react';
import rehypeRaw from 'rehype-raw';
import rehypeSantize, { defaultSchema } from 'rehype-sanitize';
import production from 'react/jsx-runtime';
import aliasComponents from './constants/aliasComponents';
import customComponents, { CustomComponentNames } from './constants/customComponents';

// Note: rehypeRaw will force the tagName to lowercase, so make sure you alias a lowercase
// tagName even if you use PascalCase in the markdown
const customComponentAliases = CustomComponentNames.map((name: string) => name.toLowerCase());
const components = { ...aliasComponents, ...customComponents };

export const generateMarkdownProcessor = () => {
  return unified()
    .use(remarkParse)
    .use(remarkGFM)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw, {
      passThrough: customComponentAliases,
    })
    .use(rehypeSantize, {
      ...defaultSchema,
      // Permits allowlisted custom components to be used
      tagNames: [...defaultSchema.tagNames!, ...customComponentAliases],
      attributes: {
        ...defaultSchema.attributes,
        // If your custom component has props that aren't in the default schema,
        // add them here so they won't get stripped out.
        recommendations: [['recs']],
        newsignal: [['count'], ['text']],
      },
    })
    .use(rehypeReact, { ...production, components });
};

const processor = generateMarkdownProcessor();

// Helper function to convert self-closing custom component tags to paired tags
// This is necessary because rehypeRaw doesn't recognize custom elements as void/self-closing
const convertSelfClosingTags = (markdown: string): string => {
  const componentPattern = customComponentAliases.join('|');
  const selfClosingPattern = new RegExp(`<(${componentPattern})([^>]*?)\\/>`, 'gi');
  return markdown.replace(selfClosingPattern, '<$1$2></$1>');
};

// Wrapper that preprocesses markdown before processing
const processWithPreprocessing = async (content: string) => {
  const preprocessedContent = convertSelfClosingTags(content);
  return processor.process(preprocessedContent);
};

export default {
  process: processWithPreprocessing,
  processSync: (content: string) => processor.processSync(content),
};
