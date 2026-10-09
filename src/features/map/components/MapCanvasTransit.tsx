import React from 'react';
import { List, X } from 'lucide-react';
import { Button } from '../../../shared/ui';

const tinyButton = 'min-h-11! px-3! text-caption! shadow-md';

export interface MapCanvasTransitProps {
  count: number;
  onOpenList?: () => void;
  filtersActive?: boolean;
  onReset?: () => void;
}

/**
 * The result count sits low in the map and opens the activity list.
 * Clear stays on the opposite corner, away from both the count and the filter row.
 */
export const MapCanvasTransit: React.FC<MapCanvasTransitProps> = ({
  count,
  onOpenList,
  filtersActive = false,
  onReset,
}) => (
  <>
    <div className="absolute bottom-16 inset-x-0 z-[1000] flex justify-center pointer-events-none">
      <Button
        size="sm"
        variant="primary"
        className={`pointer-events-auto ${tinyButton}`}
        leadingIcon={<List />}
        onClick={onOpenList}
        aria-label={`عرض ${count} نتيجة في قائمة الأنشطة`}
      >
        {count} نتيجة
      </Button>
    </div>

    {filtersActive && onReset && (
      <Button
        size="sm"
        variant="secondary"
        className={`absolute bottom-16 end-3 z-[1000] ${tinyButton}`}
        leadingIcon={<X />}
        onClick={onReset}
        aria-label="مسح الفلاتر"
      >
        مسح
      </Button>
    )}
  </>
);
