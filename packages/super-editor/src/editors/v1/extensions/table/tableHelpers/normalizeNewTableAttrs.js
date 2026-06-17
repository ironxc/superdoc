// @ts-check
import {
  DEFAULT_TBL_LOOK,
  resolvePreferredNewTableStyleId,
  TABLE_FALLBACK_BORDERS,
  TABLE_FALLBACK_CELL_PADDING,
  TABLE_STYLE_ID_TABLE_GRID,
  resolveTableProperties,
} from '@superdoc/style-engine/ooxml';
import { readTranslatedLinkedStyles } from '../../../core/parts/adapters/styles-read.js';
import { eighthPointsToPixels } from '../../../core/super-converter/helpers.js';
import { cloneBorders, mapBorderSizes } from './border-utils.js';

/**
 * @typedef {Object} NormalizedTableAttrs
 * @property {string | null} tableStyleId - Resolved style ID (null if source is 'none')
 * @property {Object} [borders] - Fallback borders when no style exists
 * @property {Object} [tableProperties] - Table properties including fallback cellMargins
 */

/**
 * Resolves the preferred table style ID from the editor's converter context.
 * Encapsulates settings access and style catalog lookup.
 *
 * @param {Object} editor - The super-editor instance
 * @returns {{ styleId: string | null, source: string }}
 */
export function resolvePreferredNewTableStyleIdFromEditor(editor) {
  const translatedLinkedStyles = readTranslatedLinkedStyles(editor);
  return resolvePreferredNewTableStyleId(null, translatedLinkedStyles);
}

/**
 * Computes the attributes for a newly created table.
 *
 * When a style is resolved, returns only `tableStyleId` — borders come from
 * the style at render time via `resolveTableProperties`.
 * When no style exists (`source: 'none'`), returns inline fallback borders
 * and cell padding so the table renders with sensible defaults.
 *
 * @param {Object} editor - The super-editor instance
 * @returns {NormalizedTableAttrs}
 */
export function normalizeNewTableAttrs(editor) {
  const translatedLinkedStyles = readTranslatedLinkedStyles(editor);
  const resolved = resolvePreferredNewTableStyleIdFromEditor(editor);

  if (resolved.source === 'none') {
    return createFallbackTableAttrs(null);
  }

  const styleHasBorders = hasResolvedTableBorders(resolved.styleId, translatedLinkedStyles);
  if (!styleHasBorders) {
    return createFallbackTableAttrs(resolved.styleId);
  }

  return {
    tableStyleId: resolved.styleId,
    // Also include tableStyleId inside tableProperties so the exporter's
    // decodeProperties loop (which iterates Object.keys(tableProperties))
    // finds it and writes <w:tblStyle> into <w:tblPr>.
    tableProperties: { tableStyleId: resolved.styleId, tblLook: { ...DEFAULT_TBL_LOOK } },
  };
}

/**
 * Fallback style ID for standalone contexts (markdown import without editor).
 * Matches Word behavior where `TableGrid` is always the default.
 */
export const STANDALONE_TABLE_STYLE_ID = TABLE_STYLE_ID_TABLE_GRID;

const TABLE_BORDER_SIDES = ['top', 'bottom', 'left', 'right', 'insideH', 'insideV'];

const hasResolvedTableBorders = (styleId, translatedLinkedStyles) => {
  const borders = resolveTableProperties(styleId, translatedLinkedStyles)?.borders;
  return Boolean(borders && typeof borders === 'object' && Object.keys(borders).length > 0);
};

const createFallbackTableAttrs = (tableStyleId) => {
  const fallbackPixelBorders = cloneBorders(TABLE_FALLBACK_BORDERS, TABLE_BORDER_SIDES);
  mapBorderSizes(fallbackPixelBorders, eighthPointsToPixels);

  const tableProperties = {
    ...(tableStyleId ? { tableStyleId, tblLook: { ...DEFAULT_TBL_LOOK } } : {}),
    borders: { ...TABLE_FALLBACK_BORDERS },
    cellMargins: {
      marginTop: { value: TABLE_FALLBACK_CELL_PADDING.top, type: 'dxa' },
      marginBottom: { value: TABLE_FALLBACK_CELL_PADDING.bottom, type: 'dxa' },
      marginLeft: { value: TABLE_FALLBACK_CELL_PADDING.left, type: 'dxa' },
      marginRight: { value: TABLE_FALLBACK_CELL_PADDING.right, type: 'dxa' },
    },
  };

  return {
    tableStyleId,
    borders: fallbackPixelBorders,
    tableProperties,
  };
};
