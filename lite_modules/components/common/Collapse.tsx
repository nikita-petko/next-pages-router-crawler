import { ReactNode, useEffect, useRef, useState } from 'react';

/**
 * Duration of the collapse/expand animation, in milliseconds. Kept in sync with the
 * `[transition:grid-template-rows_200ms_ease]` utility below (Tailwind needs the value as a
 * literal in the class string, so it can't be interpolated from this constant).
 */
const COLLAPSE_DURATION_MS = 200;

interface CollapseProps {
  children: ReactNode;
  /** Applied to the outer animated container (e.g. `width-full`). */
  className?: string;
  /** When true the content is expanded; when false it collapses to zero height. */
  in: boolean;
  /** Remove children from the DOM once fully collapsed (matches @rbx/ui `Collapse`). */
  unmountOnExit?: boolean;
}

/**
 * Foundation-friendly replacement for `@rbx/ui`'s `<Collapse>`. Animates height with a CSS grid
 * (`grid-template-rows` 1fr <-> 0fr) instead of MUI's JS-driven height measurement, so it needs no
 * WebBlox/MUI dependency. The collapsed branch delays `visibility:hidden` by the animation duration
 * so the content stays visible while the row shrinks, then is removed from the accessibility tree
 * (and tab order) once collapsed.
 */
const Collapse = ({ children, className, in: isIn, unmountOnExit = false }: CollapseProps) => {
  // Only meaningful when unmountOnExit is set: keeps children in the DOM through the exit animation.
  const [isMounted, setIsMounted] = useState<boolean>(isIn);
  const unmountTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (isIn) {
      if (unmountTimeoutRef.current) {
        clearTimeout(unmountTimeoutRef.current);
      }
      setIsMounted(true);
      return undefined;
    }

    if (!unmountOnExit) {
      return undefined;
    }

    // Defer the unmount until the collapse animation has finished so it animates out smoothly.
    unmountTimeoutRef.current = setTimeout(() => setIsMounted(false), COLLAPSE_DURATION_MS);
    return () => {
      if (unmountTimeoutRef.current) {
        clearTimeout(unmountTimeoutRef.current);
      }
    };
  }, [isIn, unmountOnExit]);

  if (unmountOnExit && !isMounted) {
    return null;
  }

  const containerClassName = `${
    isIn
      ? 'grid [grid-template-rows:1fr] [transition:grid-template-rows_200ms_ease]'
      : 'grid invisible [grid-template-rows:0fr] [transition:grid-template-rows_200ms_ease,visibility_0s_linear_200ms]'
  }${className ? ` ${className}` : ''}`;

  return (
    <div className={containerClassName}>
      <div className='clip min-height-0'>{children}</div>
    </div>
  );
};

export default Collapse;
