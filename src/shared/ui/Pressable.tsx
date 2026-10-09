import React from 'react';

export type PressableProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

const BASE =
  'cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)] disabled:cursor-not-allowed';

/**
 * Pressable — the unstyled interactive primitive.
 *
 * Use for surfaces that are clickable but are NOT an action button: list rows,
 * search suggestions, photo overlays, card hit-areas, accordion headers.
 * Action buttons use `Button`, round icon buttons use `IconButton`, filter
 * capsules use `Chip`. Every raw `<button>` in the app lives inside shared/ui.
 */
export const Pressable = React.forwardRef<HTMLButtonElement, PressableProps>(
  ({ className = '', type = 'button', ...props }, ref) => (
    <button ref={ref} type={type} className={`${BASE} ${className}`.trim()} {...props} />
  )
);

Pressable.displayName = 'Pressable';
