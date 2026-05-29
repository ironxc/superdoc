import { Plugin, PluginKey, Selection, TextSelection } from 'prosemirror-state';
import { __endComposition } from 'prosemirror-view';
import { Extension } from '../Extension.js';

const compositionSnapshots = new WeakMap();
const pendingCompositionNativeEchoes = new WeakMap();

const appendStoryInputDebugLog = (entry) => {
  const debugGlobal = globalThis;
  if (debugGlobal.__SD_DEBUG_STORY_INPUT__ !== true) {
    return;
  }

  const existingLog = Array.isArray(debugGlobal.__SD_DEBUG_STORY_INPUT_LOG__)
    ? debugGlobal.__SD_DEBUG_STORY_INPUT_LOG__
    : [];

  existingLog.push(entry);
  if (existingLog.length > 200) {
    existingLog.splice(0, existingLog.length - 200);
  }

  debugGlobal.__SD_DEBUG_STORY_INPUT_LOG__ = existingLog;
};

const isStorySurfaceEditor = (editor) => {
  const documentId = editor?.options?.documentId ?? '';
  return (
    documentId.startsWith('hf:') ||
    documentId.startsWith('fn:') ||
    documentId.startsWith('en:') ||
    editor?.options?.isHeaderOrFooter === true ||
    editor?.options?.headerFooterType === 'header' ||
    editor?.options?.headerFooterType === 'footer'
  );
};

const recordStoryInputDebug = (view, event, editor, phase, extra = {}) => {
  if (!isStorySurfaceEditor(editor)) {
    return;
  }

  let domAnchorPos = null;
  const domSelection = view?.dom?.ownerDocument?.getSelection?.() ?? null;

  try {
    if (view?.dom && domSelection?.anchorNode && view.dom.contains(domSelection.anchorNode)) {
      domAnchorPos = view.posAtDOM(domSelection.anchorNode, domSelection.anchorOffset, -1);
    }
  } catch {
    domAnchorPos = null;
  }

  appendStoryInputDebugLog({
    phase,
    documentId: editor?.options?.documentId ?? null,
    inputType: event?.inputType ?? null,
    data: event?.data ?? null,
    cancelable: event?.cancelable ?? null,
    defaultPrevented: event?.defaultPrevented ?? null,
    selectionFrom: view?.state?.selection?.from ?? null,
    selectionTo: view?.state?.selection?.to ?? null,
    domAnchorPos,
    ...extra,
  });
};

const handleInsertTextBeforeInput = (view, event, editor) => {
  const isInsertTextInput = event?.inputType === 'insertText';
  const hasTextData = typeof event?.data === 'string' && event.data.length > 0;
  const isComposing = event?.isComposing === true;

  recordStoryInputDebug(view, event, editor, 'beforeinput:start', {
    isInsertTextInput,
    hasTextData,
    isComposing,
  });

  if (!isInsertTextInput || !hasTextData || isComposing) {
    recordStoryInputDebug(view, event, editor, 'beforeinput:skip');
    return false;
  }

  const selection = view.state.selection;
  if (selection.empty && !isStorySurfaceEditor(editor)) {
    recordStoryInputDebug(view, event, editor, 'beforeinput:skip-empty-selection');
    return false;
  }

  const tr = view.state.tr.insertText(event.data, selection.from, selection.to);
  const insertedTo = Math.max(0, Math.min(selection.from + event.data.length, tr.doc.content.size));
  try {
    tr.setSelection(TextSelection.create(tr.doc, insertedTo));
  } catch {
    tr.setSelection(Selection.near(tr.doc.resolve(insertedTo), 1));
  }
  tr.setMeta('inputType', 'insertText');
  view.dispatch(tr);
  event.preventDefault();
  recordStoryInputDebug(view, event, editor, 'beforeinput:handled');

  return true;
};

const shouldForceEndStaleComposition = (view, event) => {
  if (!view.composing || event?.isComposing) {
    return false;
  }

  const inputType = event?.inputType ?? null;
  if (!inputType) {
    return false;
  }

  return !['insertCompositionText', 'deleteCompositionText'].includes(inputType);
};

const resolveCompositionSnapshotReuseDecision = (view, snapshot) => {
  if (!snapshot) {
    return {
      reuse: false,
      reason: 'no-snapshot',
      draftText: '',
      from: view.state.selection.from,
      to: view.state.selection.to,
    };
  }

  const from = snapshot.from;
  const to = view.state.selection.from;
  if (to < from) {
    return { reuse: false, reason: 'selection-before-snapshot', draftText: '', from, to };
  }

  if (to - from > 64) {
    return { reuse: false, reason: 'draft-range-too-large', draftText: '', from, to };
  }

  const draftText = view.state.doc.textBetween(from, to, '', '');
  if (/\p{Script=Han}/u.test(draftText)) {
    return { reuse: false, reason: 'draft-range-has-han', draftText, from, to };
  }

  return { reuse: true, reason: 'reuse-active-composition', draftText, from, to };
};

const resolveDomCompositionRange = (view) => {
  const domSelection = view?.dom?.ownerDocument?.getSelection?.() ?? null;
  if (!view?.dom || !domSelection?.anchorNode || !domSelection?.focusNode) return null;
  if (!view.dom.contains(domSelection.anchorNode) || !view.dom.contains(domSelection.focusNode)) return null;
  if (domSelection.isCollapsed) return null;

  try {
    const anchorPos = view.posAtDOM(domSelection.anchorNode, domSelection.anchorOffset, -1);
    const focusPos = view.posAtDOM(domSelection.focusNode, domSelection.focusOffset, -1);
    const from = Math.min(anchorPos, focusPos);
    const to = Math.max(anchorPos, focusPos);
    if (from >= to) return null;
    return { from, to, text: domSelection.toString() };
  } catch {
    return null;
  }
};

const captureCompositionSnapshot = (view) => {
  const existing = compositionSnapshots.get(view);
  if (existing) {
    const reuseDecision = resolveCompositionSnapshotReuseDecision(view, existing);
    if (reuseDecision.reuse) {
      return;
    }
  }

  const nextSnapshot = {
    from: view.state.selection.from,
    to: view.state.selection.to,
    text: view.state.doc.textContent,
  };
  compositionSnapshots.set(view, nextSnapshot);
};

const handleComposingPlainTextBeforeInput = (view, event) => {
  const isComposingPlainText =
    view?.composing === true &&
    event?.isComposing !== true &&
    event?.inputType === 'insertText' &&
    typeof event?.data === 'string' &&
    event.data.length > 0;

  if (!isComposingPlainText) {
    return false;
  }

  const snapshot = compositionSnapshots.get(view);
  const from = snapshot?.from ?? view.state.selection.from;
  const to = view.state.selection.from;
  const draftText = to >= from && to - from <= 64 ? view.state.doc.textBetween(from, to, '', '') : '';

  if (event.data.trim().length === 0) {
    const replaceFrom = Math.max(0, Math.min(from, view.state.doc.content.size));
    const replaceTo = Math.max(replaceFrom, Math.min(to, view.state.doc.content.size));
    event.preventDefault();
    if (replaceTo > replaceFrom && !/\p{Script=Han}/u.test(draftText)) {
      const tr = view.state.tr.delete(replaceFrom, replaceTo);
      tr.setMeta('inputType', 'deleteCompositionText');
      tr.setMeta('compositionAbort', true);
      view.dispatch(tr);
    }
    compositionSnapshots.delete(view);
    __endComposition(view);
    return true;
  }

  const replaceFrom = Math.max(0, Math.min(from, view.state.doc.content.size));
  const replaceTo = Math.max(replaceFrom, Math.min(to, view.state.doc.content.size));
  const tr = view.state.tr.insertText(event.data, replaceFrom, replaceTo);
  tr.setMeta('inputType', 'insertCompositionText');
  tr.setMeta('compositionCommit', true);
  view.dispatch(tr);
  event.preventDefault();
  compositionSnapshots.delete(view);
  return true;
};

const suppressCompositionPreviewTextBeforeInput = (view, event) => {
  const isCompositionPreviewText =
    view?.composing === true &&
    event?.isComposing === true &&
    event?.inputType === 'insertCompositionText' &&
    typeof event?.data === 'string' &&
    /\p{Script=Han}/u.test(event.data);

  if (!isCompositionPreviewText) {
    return false;
  }

  if (event.cancelable === false) {
    return false;
  }

  const snapshot = compositionSnapshots.get(view);
  const from = snapshot?.from ?? view.state.selection.from;
  const domRange = resolveDomCompositionRange(view);
  const to = domRange?.from === from ? domRange.to : view.state.selection.from;
  pendingCompositionNativeEchoes.set(view, {
    data: event.data,
    from: to,
    createdAt: Date.now(),
  });
  event.preventDefault();
  return true;
};

const clearPendingCompositionNativeEcho = (view, event) => {
  const pending = pendingCompositionNativeEchoes.get(view);
  const isMatchingEcho =
    pending &&
    event?.inputType === 'insertCompositionText' &&
    event?.data === pending.data &&
    Date.now() - pending.createdAt < 1000;

  if (!isMatchingEcho) {
    return false;
  }

  pendingCompositionNativeEchoes.delete(view);
  const from = Math.max(0, Math.min(pending.from ?? view.state.selection.from, view.state.doc.content.size));
  const to = Math.max(from, Math.min(from + pending.data.length, view.state.doc.content.size));
  const echoedText = to >= from ? view.state.doc.textBetween(from, to, '', '') : '';
  if (echoedText !== pending.data) {
    return false;
  }

  const tr = view.state.tr.delete(from, to);
  tr.setMeta('inputType', 'deleteCompositionText');
  tr.setMeta('compositionEchoCleanup', true);
  view.dispatch(tr);
  return true;
};

const NAVIGATION_KEYS = new Set([
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Home',
  'End',
  'PageUp',
  'PageDown',
]);

/**
 * Editable extension controls whether the editor accepts user input.
 *
 * When editable is false, all user interactions are blocked:
 * - Text input via beforeinput events
 * - Mouse interactions via mousedown (unless allowSelectionInViewMode is true)
 * - Focus via automatic blur (unless allowSelectionInViewMode is true)
 * - Click, double-click, and triple-click events (unless allowSelectionInViewMode is true)
 * - Keyboard shortcuts via handleKeyDown
 * - Paste and drop events
 *
 * When allowSelectionInViewMode is true and editable is false:
 * - Mouse interactions are allowed for text selection
 * - Focus is allowed
 * - Click events are allowed for selection
 * - Navigation keys (arrows, Home/End, PageUp/PageDown) are allowed
 * - Copy (Ctrl/Cmd+C) and Select All (Ctrl/Cmd+A) are allowed
 * - IME/composition input, text input, paste, and drop remain blocked
 */
export const Editable = Extension.create({
  name: 'editable',

  addPmPlugins() {
    const editor = this.editor;

    /** True when all interaction should be blocked (not editable AND no selection-only override). */
    const isFullyBlocked = () => !editor.options.editable && !editor.options.allowSelectionInViewMode;

    /** Block an event when the editor is not editable (regardless of allowSelectionInViewMode). */
    const blockWhenNotEditable = (_view, event) => {
      if (!editor.options.editable) {
        event.preventDefault();
        return true;
      }
      return false;
    };

    const editablePlugin = new Plugin({
      key: new PluginKey('editable'),
      props: {
        editable: () => editor.options.editable,
        handleDOMEvents: {
          beforeinput: (view, event) => {
            recordStoryInputDebug(view, event, editor, 'dom:beforeinput');
            if (!editor.options.editable) {
              event.preventDefault();
              return true;
            }

            if (suppressCompositionPreviewTextBeforeInput(view, event)) {
              return true;
            }

            if (handleComposingPlainTextBeforeInput(view, event)) {
              return true;
            }

            if (shouldForceEndStaleComposition(view, event)) {
              __endComposition(view);
            }

            // When typing over an existing selection, browser-native text input
            // can widen the replace range around hidden inline content in story
            // editors. Apply the replacement against the PM selection directly
            // before the browser mutates the DOM.
            if (handleInsertTextBeforeInput(view, event, editor)) {
              return true;
            }
            return false;
          },
          input: (view, event) => {
            clearPendingCompositionNativeEcho(view, event);
            recordStoryInputDebug(view, event, editor, 'dom:input');
            return false;
          },
          compositionstart: (view, event) => {
            if (editor.options.editable) {
              captureCompositionSnapshot(view);
            }
            return blockWhenNotEditable(view, event);
          },
          compositionupdate: (view, event) => blockWhenNotEditable(view, event),
          compositionend: (view, event) => {
            compositionSnapshots.delete(view);
            pendingCompositionNativeEchoes.delete(view);
            return blockWhenNotEditable(view, event);
          },
          mousedown: (_view, event) => {
            if (isFullyBlocked()) {
              event.preventDefault();
              return true;
            }
            return false;
          },
          focus: (view, event) => {
            if (isFullyBlocked()) {
              event.preventDefault();
              view.dom.blur();
              return true;
            }
            return false;
          },
        },
        handleClick: () => isFullyBlocked(),
        handleDoubleClick: () => isFullyBlocked(),
        handleTripleClick: () => isFullyBlocked(),
        handleKeyDown: (_view, event) => {
          if (!editor.options.editable) {
            if (editor.options.allowSelectionInViewMode) {
              if (NAVIGATION_KEYS.has(event.key)) return false;

              const isCopyOrSelectAll =
                (event.ctrlKey || event.metaKey) && ['c', 'a'].includes(event.key.toLowerCase());
              if (isCopyOrSelectAll) return false;
            }
            return true;
          }
          return false;
        },
        handlePaste: () => !editor.options.editable,
        handleDrop: () => !editor.options.editable,
      },
    });

    return [editablePlugin];
  },
});
