import { ReactGridLayoutProps, Layout } from 'react-grid-layout';

type CompactType = ReactGridLayoutProps['compactType'];

export const getStatics = (layouts: Layout[]): Array<Layout> => {
  return layouts.filter(l => l.static);
}

export function sortLayoutItemsByRowCol(layouts: Layout[]): Layout[] {
  // Slice to clone array as sort modifies
  return layouts.slice(0).sort(function (a, b) {
    if (a.y > b.y || (a.y === b.y && a.x > b.x)) {
      return 1;
    } else if (a.y === b.y && a.x === b.x) {
      // Without this, we can get different sort results in IE vs. Chrome/FF
      return 0;
    }
    return -1;
  });
}

/**
 * Sort layout items by column ascending then row ascending.
 *
 * Does not modify Layout.
 */
export function sortLayoutItemsByColRow(layouts: Layout[]): Layout[] {
  return layouts.slice(0).sort(function (a, b) {
    if (a.x > b.x || (a.x === b.x && a.y > b.y)) {
      return 1;
    }
    return -1;
  });
}

export function sortLayoutItems(
  layouts: Layout[],
  compactType: CompactType
): Layout[] {
  if (compactType === "horizontal") return sortLayoutItemsByColRow(layouts);
  if (compactType === "vertical") return sortLayoutItemsByRowCol(layouts);
  else return layouts;
}

export function cloneLayoutItem(layoutItem: Layout): Layout {
  return {
    w: layoutItem.w,
    h: layoutItem.h,
    x: layoutItem.x,
    y: layoutItem.y,
    i: layoutItem.i,
    minW: layoutItem.minW,
    maxW: layoutItem.maxW,
    minH: layoutItem.minH,
    maxH: layoutItem.maxH,
    moved: Boolean(layoutItem.moved),
    static: Boolean(layoutItem.static),
    // These can be null/undefined
    isDraggable: layoutItem.isDraggable,
    isResizable: layoutItem.isResizable,
    resizeHandles: layoutItem.resizeHandles,
    isBounded: layoutItem.isBounded
  };
}

export function collides(l1: Layout, l2: Layout): boolean {
  if (l1.i === l2.i) return false; // same element
  if (l1.x + l1.w <= l2.x) return false; // l1 is left of l2
  if (l1.x >= l2.x + l2.w) return false; // l1 is right of l2
  if (l1.y + l1.h <= l2.y) return false; // l1 is above l2
  if (l1.y >= l2.y + l2.h) return false; // l1 is below l2
  return true; // boxes overlap
}

export function getFirstCollision(
  layouts: Layout[],
  layoutItem: Layout
): Layout {
  for (let i = 0, len = layouts.length; i < len; i++) {
    if (collides(layouts[i], layoutItem)) return layouts[i];
  }
}

export function bottom(layouts: Layout[]): number {
  let max = 0,
    bottomY;
  for (let i = 0, len = layouts.length; i < len; i++) {
    bottomY = layouts[i].y + layouts[i].h;
    if (bottomY > max) max = bottomY;
  }
  return max;
}

const heightWidth = { x: "w", y: "h" };

function resolveCompactionCollision(
  layouts: Layout[],
  item: Layout,
  moveToCoord: number,
  axis: "x" | "y"
) {
  const sizeProp = heightWidth[axis];
  item[axis] += 1;
  const itemIndex = layouts
    .map(layoutItem => {
      return layoutItem.i;
    })
    .indexOf(item.i);

  // Go through each item we collide with.
  for (let i = itemIndex + 1; i < layouts.length; i++) {
    const otherItem = layouts[i];
    // Ignore static items
    if (otherItem.static) continue;

    // Optimization: we can break early if we know we're past this el
    // We can do this b/c it's a sorted layout
    if (otherItem.y > item.y + item.h) break;

    if (collides(item, otherItem)) {
      resolveCompactionCollision(
        layouts,
        otherItem,
        moveToCoord + item[sizeProp],
        axis
      );
    }
  }

  item[axis] = moveToCoord;
}

export function compactItem(
  compareWith: Layout[],
  l: Layout,
  compactType: CompactType,
  cols: number,
  fullLayout: Layout[],
  allowOverlap?: boolean
): Layout {
  const compactV = compactType === "vertical";
  const compactH = compactType === "horizontal";
  if (compactV) {
    // Bottom 'y' possible is the bottom of the layout.
    // This allows you to do nice stuff like specify {y: Infinity}
    // This is here because the layout must be sorted in order to get the correct bottom `y`.
    l.y = Math.min(bottom(compareWith), l.y);
    // Move the element up as far as it can go without colliding.
    while (l.y > 0 && !getFirstCollision(compareWith, l)) {
      l.y--;
    }
  } else if (compactH) {
    // Move the element left as far as it can go without colliding.
    while (l.x > 0 && !getFirstCollision(compareWith, l)) {
      l.x--;
    }
  }

  // Move it down, and keep moving it down if it's colliding.
  let collides;
  // Checking the compactType null value to avoid breaking the layout when overlapping is allowed.
  while (
    (collides = getFirstCollision(compareWith, l)) &&
    !(compactType === null && allowOverlap)
  ) {
    if (compactH) {
      resolveCompactionCollision(fullLayout, l, collides.x + collides.w, "x");
    } else {
      resolveCompactionCollision(fullLayout, l, collides.y + collides.h, "y");
    }
    // Since we can't grow without bounds horizontally, if we've overflown, let's move it down and try again.
    if (compactH && l.x + l.w > cols) {
      l.x = cols - l.w;
      l.y++;
      // ALso move element as left as we can
      while (l.x > 0 && !getFirstCollision(compareWith, l)) {
        l.x--;
      }
    }
  }

  // Ensure that there are no negative positions
  l.y = Math.max(l.y, 0);
  l.x = Math.max(l.x, 0);

  return l;
}

export function compact(
  layouts: Layout[],
  compactType: ReactGridLayoutProps['compactType'],
  cols: number,
  allowOverlap?: boolean
): Layout[] {


  // Statics go in the compareWith array right away so items flow around them.
  const compareWith = getStatics(layouts);
  // We go through the items by row and column.
  const sorted = sortLayoutItems(layouts, compactType);
  // Holding for new items.
  const out = Array(layouts.length);

  for (let i = 0, len = sorted.length; i < len; i++) {
    let l = cloneLayoutItem(sorted[i]);

    // Don't move static elements
    if (!l.static) {
      l = compactItem(compareWith, l, compactType, cols, sorted, allowOverlap);

      // Add to comparison array. We only collide with items before this one.
      // Statics are already in this array.
      compareWith.push(l);
    }

    // Add to output array to make sure they still come out in the right order.
    out[layouts.indexOf(sorted[i])] = l;

    // Clear moved flag, if it exists.
    l.moved = false;
  }

  return out;
}