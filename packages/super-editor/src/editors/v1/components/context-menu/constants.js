import plusIconSvg from '@superdoc/common/icons/plus-solid.svg?raw';
import trashIconSvg from '@superdoc/common/icons/trash-can-solid.svg?raw';
import wrenchIconSvg from '@superdoc/common/icons/wrench-solid.svg?raw';
import borderNoneIconSvg from '@superdoc/common/icons/border-none-solid.svg?raw';
import arrowsLeftRightIconSvg from '@superdoc/common/icons/arrows-left-right-solid.svg?raw';
import arrowsToDotIconSvg from '@superdoc/common/icons/arrows-to-dot-solid.svg?raw';
import magicWandIcon from '@superdoc/common/icons/magic-wand-solid.svg?raw';
import linkIconSvg from '@superdoc/common/icons/link-solid.svg?raw';
import tableIconSvg from '@superdoc/common/icons/table-solid.svg?raw';
import scissorsIconSvg from '@superdoc/common/icons/scissors-solid.svg?raw';
import copyIconSvg from '@superdoc/common/icons/copy-solid.svg?raw';
import pasteIconSvg from '@superdoc/common/icons/paste-solid.svg?raw';
import checkIconSvg from '@superdoc/common/icons/check-solid.svg?raw';
import xMarkIconSvg from '@superdoc/common/icons/xmark-solid.svg?raw';
import paintRollerIconSvg from '@superdoc/common/icons/paint-roller-solid.svg?raw';
import rotateRightIconSvg from '@superdoc/common/icons/rotate-right-solid.svg?raw';
import indentIconSvg from '@superdoc/common/icons/indent-solid.svg?raw';
import outdentIconSvg from '@superdoc/common/icons/outdent-solid.svg?raw';
import listOlIconSvg from '@superdoc/common/icons/list-ol-solid.svg?raw';

export const ICONS = {
  addRowBefore: plusIconSvg,
  addRowAfter: plusIconSvg,
  addColumnBefore: plusIconSvg,
  addColumnAfter: plusIconSvg,
  deleteRow: trashIconSvg,
  deleteColumn: trashIconSvg,
  deleteTable: trashIconSvg,
  deleteBorders: borderNoneIconSvg,
  mergeCells: arrowsToDotIconSvg,
  splitCell: arrowsLeftRightIconSvg,
  fixTables: wrenchIconSvg,
  ai: magicWandIcon,
  link: linkIconSvg,
  table: tableIconSvg,
  cut: scissorsIconSvg,
  copy: copyIconSvg,
  paste: pasteIconSvg,
  addDocumentSection: plusIconSvg,
  removeDocumentSection: trashIconSvg,
  trackChangesAccept: checkIconSvg,
  trackChangesReject: xMarkIconSvg,
  cellBackground: paintRollerIconSvg,
  updateTableOfContents: rotateRightIconSvg,
  listRestartNumbering: listOlIconSvg,
  listContinueNumbering: listOlIconSvg,
  listDecreaseIndent: outdentIconSvg,
  listIncreaseIndent: indentIconSvg,
};

// Table actions constant
export const TEXTS = {
  addRowBefore: '在上方插入行',
  addRowAfter: '在下方插入行',
  addColumnBefore: '在左侧插入列',
  addColumnAfter: '在右侧插入列',
  deleteRow: '删除行',
  deleteColumn: '删除列',
  deleteTable: '删除表格',
  removeBorders: '移除边框',
  mergeCells: '合并单元格',
  splitCell: '拆分单元格',
  fixTables: '修复表格',
  insertText: '插入文本',
  replaceText: '替换文本',
  insertLink: '插入链接',
  insertTable: '插入表格',
  editTable: '编辑表格',
  cut: '剪切',
  copy: '复制',
  paste: '粘贴',
  removeDocumentSection: '移除节',
  createDocumentSection: '创建节',
  trackChangesAccept: '接受修订',
  trackChangesReject: '拒绝修订',
  cellBackground: '单元格背景',
  updateTableOfContents: '更新目录',
  listRestartNumbering: '重新开始编号',
  listContinueNumbering: '继续编号',
  listDecreaseIndent: '减少缩进',
  listIncreaseIndent: '增加缩进',
};

export const tableActionsOptions = [
  {
    label: TEXTS.addRowBefore,
    command: 'addRowBefore',
    icon: ICONS.addRowBefore,
    props: {
      'data-item': 'btn-tableActions-option',
      ariaLabel: '在上方插入行',
    },
  },
  {
    label: TEXTS.addRowAfter,
    command: 'addRowAfter',
    icon: ICONS.addRowAfter,
    props: {
      'data-item': 'btn-tableActions-option',
      ariaLabel: '在下方插入行',
    },
  },
  {
    label: TEXTS.addColumnBefore,
    command: 'addColumnBefore',
    icon: ICONS.addColumnBefore,
    props: {
      'data-item': 'btn-tableActions-option',
      ariaLabel: '在左侧插入列',
    },
  },
  {
    label: TEXTS.addColumnAfter,
    command: 'addColumnAfter',
    icon: ICONS.addColumnAfter,
    bottomBorder: true,
    props: {
      'data-item': 'btn-tableActions-option',
      ariaLabel: '在右侧插入列',
    },
  },
  {
    label: TEXTS.deleteRow,
    command: 'deleteRow',
    icon: ICONS.deleteRow,
    props: {
      'data-item': 'btn-tableActions-option',
      ariaLabel: '删除行',
    },
  },
  {
    label: TEXTS.deleteColumn,
    command: 'deleteColumn',
    icon: ICONS.deleteColumn,
    props: {
      'data-item': 'btn-tableActions-option',
      ariaLabel: '删除列',
    },
  },
  {
    label: TEXTS.deleteTable,
    command: 'deleteTable',
    icon: ICONS.deleteTable,
    props: {
      'data-item': 'btn-tableActions-option',
      ariaLabel: '删除表格',
    },
  },
  {
    label: TEXTS.removeBorders,
    command: 'deleteCellAndTableBorders',
    icon: ICONS.deleteBorders,
    bottomBorder: true,
    props: {
      'data-item': 'btn-tableActions-option',
      ariaLabel: '删除单元格和表格边框',
    },
  },
  {
    label: TEXTS.mergeCells,
    command: 'mergeCells',
    icon: ICONS.mergeCells,
    props: {
      'data-item': 'btn-tableActions-option',
      ariaLabel: '合并单元格',
    },
  },
  {
    label: TEXTS.splitCell,
    command: 'splitCell',
    icon: ICONS.splitCell,
    props: {
      'data-item': 'btn-tableActions-option',
      ariaLabel: '拆分单元格',
    },
  },
  {
    label: TEXTS.fixTables,
    command: 'fixTables',
    icon: ICONS.fixTables,
    props: {
      'data-item': 'btn-tableActions-option',
      ariaLabel: '修复表格',
    },
  },
];

export const TRIGGERS = {
  slash: 'slash',
  click: 'click',
};
