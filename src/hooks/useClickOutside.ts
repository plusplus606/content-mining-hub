'use client';

import { RefObject, useEffect } from 'react';

type TargetElement = HTMLElement | null;

type UseClickOutsideOptions = {
  active?: boolean;
};

export function useClickOutside(
  refs: Array<RefObject<TargetElement>>,
  onOutside: () => void,
  options: UseClickOutsideOptions = {}
) {
  const { active = true } = options;

  useEffect(() => {
    if (!active) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;

      const clickedOutsideAll = refs.every((ref) => {
        const element = ref.current;
        return !element || !element.contains(target);
      });

      if (clickedOutsideAll) {
        onOutside();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [active, onOutside, refs]);
}
