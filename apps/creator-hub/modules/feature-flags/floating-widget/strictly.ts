import { TTailwindClass } from '@rbx/foundation-tailwind/classes';

/**
 * Simple type-safe class name helper that only accepts foundation-tailwind classes.
 * TypeScript will show an error if you try to use an unsupported class.
 *
 * Usage: cn('flex', 'items-center', 'padding-medium')
 */
const cn = (...classes: TTailwindClass[]): string => classes.filter(Boolean).join(' ');

export default cn;
