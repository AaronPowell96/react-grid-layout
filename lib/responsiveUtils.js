// @flow

import { cloneLayout, compact, correctBounds } from "./utils";

import type { CompactType, Layout } from "./utils";

export type Breakpoint = string;
export type DefaultBreakpoints = "lg" | "md" | "sm" | "xs" | "xxs";

// + indicates read-only
export type ResponsiveLayout<T: Breakpoint> = {
  +[breakpoint: T]: Layout
};
export type Breakpoints<T: Breakpoint> = {
  +[breakpoint: T]: number
};

/**
 * Given a width, find the highest breakpoint that matches is valid for it (width > breakpoint).
 *
 * @param  {Object} breakpoints Breakpoints object (e.g. {lg: 1200, md: 960, ...})
 * @param  {Number} width Screen width.
 * @return {String}       Highest breakpoint that is less than width.
 */
export function getBreakpointFromWidth(
  breakpoints: Breakpoints<Breakpoint>,
  width: number
): Breakpoint {
  const sorted = sortBreakpoints(breakpoints);
  let matching = sorted[0];
  for (let i = 1, len = sorted.length; i < len; i++) {
    const breakpointName = sorted[i];
    if (width > breakpoints[breakpointName]) matching = breakpointName;
  }
  return matching;
}

/**
 * Given a breakpoint, get the # of cols set for it.
 * @param  {String} breakpoint Breakpoint name.
 * @param  {Object} cols       Map of breakpoints to cols.
 * @return {Number}            Number of cols.
 */
export function getColsFromBreakpoint(
  breakpoint: Breakpoint,
  cols: Breakpoints<Breakpoint>
): number {
  if (!cols[breakpoint]) {
    throw new Error(
      "ResponsiveReactGridLayout: `cols` entry for breakpoint " +
        breakpoint +
        " is missing!"
    );
  }
  return cols[breakpoint];
}

/**
 * Given existing layouts and a new breakpoint, find or generate a new layout.
 *
 * This finds the layout above the new one and generates from it, if it exists.
 *
 * @param  {Object} layouts     Existing layouts.
 * @param  {Array} breakpoints All breakpoints.
 * @param  {String} breakpoint New breakpoint.
 * @param  {String} breakpoint Last breakpoint (for fallback).
 * @param  {Number} cols       Column count at new breakpoint.
 * @param  {Boolean} verticalCompact Whether or not to compact the layout
 *   vertically.
 * @return {Array}             New layout.
 */
export function findOrGenerateResponsiveLayout(
  layouts: ResponsiveLayout<Breakpoint>,
  breakpoints: Breakpoints<Breakpoint>,
  breakpoint: Breakpoint,
  lastBreakpoint: Breakpoint,
  cols: number,
  compactType: CompactType,
  toolboxItems: ResponsiveLayout<Breakpoint> = {}
): Layout {
  console.log("toolbox items", toolboxItems);
  // If it already exists, just return it.
  console.log("generage called with layouts:", layouts);
  console.log(
    "generate called with: breakpoints",
    breakpoints,
    "breakpoint:",
    breakpoint,
    "lastbreakpoint",
    lastBreakpoint
  );
  if (layouts[breakpoint]) {
    const items = cloneLayout(toolboxItems[breakpoint]);
    const reduced = cloneLayout(layouts[breakpoint]).reduce((acc, current) => {
      if (toolboxItems[breakpoint]) {
        for (const item of items || []) {
          console.log("inside toolbox loop", item.i, current.i);
          if (item.i === current.i) {
            return acc;
          }
        }
      }
      return [...acc, current];
    }, []);

    console.log("MY REDUCED LAYOUT", reduced);
    console.log("USING LAYOUT old:", layouts[breakpoint]);

    return cloneLayout(reduced);
  }

  // if toolbox and layouts are empty, maybe something went wrong, try to use the next layout from breakpoint larger than current one
  if (
    !(toolboxItems[breakpoint] || []).length &&
    !(layouts[breakpoint] || []).length
  ) {
    const breakpointsSorted = sortBreakpoints(breakpoints);
    const breakpointsAbove = breakpointsSorted.slice(
      breakpointsSorted.indexOf(breakpoint)
    );
    for (let i = 0, len = breakpointsAbove.length; i < len; i++) {
      const b = breakpointsAbove[i];
      console.log("breakpointsAbove[i]", breakpointsAbove[i]);
      if (layouts[b]) {
        const aboveBreakpointToolboxItems = toolboxItems[b] || [];
        let layout = [...layouts[b], ...aboveBreakpointToolboxItems];
        layout = correctBounds(layout, { cols: cols });
        return compact(layout, compactType, cols);
      }
    }
  }
  // layout = cloneLayout(layout || []); // clone layout so we don't modify existing items
  return [];
  // return compact(correctBounds(layout, { cols: cols }), compactType, cols);
}

/**
 * Given breakpoints, return an array of breakpoints sorted by width. This is usually
 * e.g. ['xxs', 'xs', 'sm', ...]
 *
 * @param  {Object} breakpoints Key/value pair of breakpoint names to widths.
 * @return {Array}              Sorted breakpoints.
 */
export function sortBreakpoints(
  breakpoints: Breakpoints<Breakpoint>
): Array<Breakpoint> {
  const keys: Array<string> = Object.keys(breakpoints);
  return keys.sort(function (a, b) {
    return breakpoints[a] - breakpoints[b];
  });
}
