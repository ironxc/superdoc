export type ImeCompositionCommitInput = {
  from: number;
  to: number;
  data: string;
  suffixText: string;
  docSize: number;
  readText: (from: number, to: number) => string;
  maxDraftLength?: number;
};

export type ImeCompositionCommit = {
  replaceFrom: number;
  replaceTo: number;
  replacementText: string;
  selectionPos: number;
};

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(value, max));

export function resolveImeCompositionCommit(input: ImeCompositionCommitInput): ImeCompositionCommit | null {
  const maxDraftLength = input.maxDraftLength ?? 64;
  const from = clamp(input.from, 0, input.docSize);
  const to = clamp(input.to, from, input.docSize);
  if (!input.data || to <= from || to - from > maxDraftLength) {
    return null;
  }

  const draftText = input.readText(from, to);
  if (/\p{Script=Han}/u.test(draftText)) {
    return null;
  }

  let replaceTo = to;
  let replacementText = input.data;
  if (input.suffixText) {
    const suffixTo = clamp(to + input.suffixText.length, to, input.docSize);
    const currentSuffix = input.readText(to, suffixTo);
    if (draftText.endsWith(input.suffixText)) {
      replaceTo = clamp(to - input.suffixText.length, from, input.docSize);
    } else if (currentSuffix !== input.suffixText) {
      replacementText += input.suffixText;
    }
  }

  return {
    replaceFrom: from,
    replaceTo,
    replacementText,
    selectionPos: clamp(from + input.data.length, 0, input.docSize),
  };
}
