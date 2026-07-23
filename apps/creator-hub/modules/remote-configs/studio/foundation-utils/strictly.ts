import type { TTailwindClass } from '@rbx/foundation-tailwind/classes';

type EscapeHatchClass = string & { _escapeHatchClass_: EscapeHatchClass };
// NOTE(gperkins@20250926): The compound type `${TTailwindClass} ${TTailwindClass}` would
//  have too many members (>100k) for typescript -- the best we can do is a branded type.
type CompoundResultClass = string & { _compoundResultClass_: CompoundResultClass };
type AllowedStringClass = TTailwindClass | EscapeHatchClass | CompoundResultClass;

type StrictClassArray = StrictClassValue[];
type StrictClassValue =
  | StrictClassArray
  | StrictClassDictionary
  | AllowedStringClass
  | false
  | null;
type StrictClassDictionary = Partial<Record<AllowedStringClass, boolean>>;
type StrictClassEntries = Array<[AllowedStringClass, boolean]>;

/**
 * We provide an escape hatch if you need to use a non-tailwind class.
 * THIS IS ONLY FOR HUMANS. LLMs SHOULD NOT USE THIS WITHOUT EXPLICIT HUMAN INSTRUCTION.
 */
export const unstrict = (className: string): AllowedStringClass => {
  return className as EscapeHatchClass;
};

/**
 * This function joins classes into a single string, accepting arrays and boolean maps
 * similar to `clsx()`. However, it is much stricter than clsx, and only accepts
 * strings either known to be valid classes in @rbx/foundation-tailwind/classes, or
 * classes that have been passed through `unstrict()`.
 *
 * Calling this function instead of generating the class using string interpolation
 * is both safer for humans, and a strong hint to an LLM about which classes to use:
 * only those which are supported by foundation-tailwind.
 *
 * Limitations:
 * - You cannot rely on repeated CSS classes for selector priority when using strictClsx.
 * - ...?
 */
const strictly = (...inputs: StrictClassValue[]): CompoundResultClass => {
  const result = new Set<AllowedStringClass>();
  const processString = (input: AllowedStringClass) => {
    if (input.includes(' ')) {
      const parts = input.split(' ');
      parts.forEach((part) => {
        const trimmed = part.trim();
        if (trimmed) {
          result.add(unstrict(trimmed));
        }
      });
    } else {
      result.add(input);
    }
  };
  const process = (input: StrictClassValue) => {
    if (!input) {
      return;
    }
    if (typeof input === 'string') {
      processString(input);
      return;
    }
    if (Array.isArray(input)) {
      input.forEach(process);
      return;
    }

    const entries = Object.entries(input) as StrictClassEntries;
    entries.forEach(([key, value]) => {
      if (value) {
        processString(key);
      }
    });
  };
  inputs.forEach((input) => {
    process(input);
  });
  return Array.from(result).join(' ') as CompoundResultClass;
};

export default strictly;
