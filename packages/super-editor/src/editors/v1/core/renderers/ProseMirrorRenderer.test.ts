import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProseMirrorRenderer } from './ProseMirrorRenderer.js';
import type { Editor } from '../Editor.js';

const fontFace = (family: string, url: string) => `
  @font-face {
    font-family: ${family};
    src: url(${url}) format('truetype');
  }
`;

describe('ProseMirrorRenderer.initFonts', () => {
  const originalRevokeObjectURL = URL.revokeObjectURL;

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: originalRevokeObjectURL,
    });
  });

  it('replaces document font styles when a new document is loaded', () => {
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeObjectURL,
    });

    const getFontFaceImportString = vi
      .fn()
      .mockReturnValueOnce({
        styleString: fontFace('FirstDocFont', 'blob:first-doc-font'),
        fontsImported: ['FirstDocFont'],
      })
      .mockReturnValueOnce({
        styleString: fontFace('SecondDocFont', 'blob:second-doc-font'),
        fontsImported: ['SecondDocFont'],
      })
      .mockReturnValueOnce(undefined);

    const editor = {
      converter: { getFontFaceImportString },
      fontsImported: ['StaleFont'],
    } as unknown as Editor;
    const renderer = new ProseMirrorRenderer();

    renderer.initFonts(editor);
    expect(editor.fontsImported).toEqual(['FirstDocFont']);
    expect(document.head.textContent).toContain('FirstDocFont');

    renderer.initFonts(editor);
    expect(editor.fontsImported).toEqual(['SecondDocFont']);
    expect(document.head.textContent).not.toContain('FirstDocFont');
    expect(document.head.textContent).toContain('SecondDocFont');
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:first-doc-font');

    renderer.initFonts(editor);
    expect(editor.fontsImported).toEqual([]);
    expect(document.head.textContent).not.toContain('SecondDocFont');
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:second-doc-font');
  });
});
