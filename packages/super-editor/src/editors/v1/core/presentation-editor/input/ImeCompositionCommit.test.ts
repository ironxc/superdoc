import { describe, expect, it } from 'vitest';
import { resolveImeCompositionCommit } from './ImeCompositionCommit.js';

const readerFor = (text: string) => (from: number, to: number) => text.slice(from, to);

describe('resolveImeCompositionCommit', () => {
  it('keeps the caret before the preserved suffix when the IME draft consumed it', () => {
    const commit = resolveImeCompositionCommit({
      from: 1,
      to: 4,
      data: '我',
      suffixText: '2',
      docSize: 5,
      readText: readerFor('1wo23'),
    });

    expect(commit).toEqual({
      replaceFrom: 1,
      replaceTo: 3,
      replacementText: '我',
      selectionPos: 2,
    });
  });

  it('restores a missing suffix without moving the caret after it', () => {
    const commit = resolveImeCompositionCommit({
      from: 1,
      to: 3,
      data: '我',
      suffixText: '2',
      docSize: 4,
      readText: readerFor('1wo3'),
    });

    expect(commit).toEqual({
      replaceFrom: 1,
      replaceTo: 3,
      replacementText: '我2',
      selectionPos: 2,
    });
  });

  it('does not rewrite a range that already contains committed Han text', () => {
    const commit = resolveImeCompositionCommit({
      from: 1,
      to: 2,
      data: '我',
      suffixText: '2',
      docSize: 4,
      readText: readerFor('1我23'),
    });

    expect(commit).toBeNull();
  });
});
