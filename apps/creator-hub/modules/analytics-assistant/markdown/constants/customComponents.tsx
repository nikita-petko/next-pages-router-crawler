import React, { ComponentPropsWithoutRef } from 'react';
import NewSignalComponent from '../components/NewSignal';

// Note: rehypeRaw will force the tagName to lowercase, so make sure you alias a lowercase
// tagName even if you use PascalCase in the markdown
export enum CustomComponentName {
  NewSignal = 'newsignal',
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- Required to augment JSX.IntrinsicElements for rehype-react custom components
  namespace JSX {
    interface IntrinsicElements {
      [CustomComponentName.NewSignal]: ComponentPropsWithoutRef<typeof NewSignalComponent>;
    }
  }
}

// Create a type map for component props
type ComponentPropsMap = {
  [CustomComponentName.NewSignal]: ComponentPropsWithoutRef<typeof NewSignalComponent>;
};

// This ensures each component gets its correct prop type
const customComponents: {
  [K in CustomComponentName]: React.ComponentType<ComponentPropsMap[K]>;
} = {
  [CustomComponentName.NewSignal]: (props: ComponentPropsWithoutRef<typeof NewSignalComponent>) => (
    <NewSignalComponent {...props} />
  ),
};

export const CustomComponentNames = Object.values(CustomComponentName);

export default customComponents;
