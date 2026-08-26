import { create } from "zustand";
import { generateIdea } from "./generate";
import {
  EMPTY_PROGRESS,
  loadProgress,
  saveProgress,
  type ProgressSnapshot,
} from "./progress";
import type {
  CustomKeyword,
  CustomSubtype,
  CustomType,
  Idea,
  KeywordSort,
  PatternId,
  Token,
} from "./types";
import { isBuiltIn, PATTERN_IDS, visibleBuiltIns } from "./types";

function normalizeWord(word: string) {
  return word.trim().replace(/\s+/g, " ");
}

function uid() {
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 8)}`;
}

function slugify(name: string) {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || uid();
}

function matchCustom(
  keyword: CustomKeyword,
  patterns: PatternId[],
  subtypeIds: string[],
) {
  if (patterns.length === 0 && subtypeIds.length === 0) return true;
  if (subtypeIds.length > 0 && keyword.subtypeId && subtypeIds.includes(keyword.subtypeId)) {
    return true;
  }
  if (patterns.length > 0 && patterns.includes(keyword.pattern)) return true;
  return false;
}

type State = {
  patterns: PatternId[];
  subtypeFilters: string[];
  count: number;
  batch: 1 | 3;
  element: string;
  rolling: boolean;
  ideas: Idea[];
  archive: Idea[];
  customKeywords: CustomKeyword[];
  subtypes: CustomSubtype[];
  customTypes: CustomType[];
  hiddenTypes: string[];
  useCustom: boolean;
  exclusiveCustom: boolean;
  keywordSort: KeywordSort;
  setPatterns: (patterns: PatternId[]) => void;
  togglePattern: (id: PatternId) => void;
  toggleSubtypeFilter: (id: string) => void;
  setCount: (count: number) => void;
  setBatch: (batch: 1 | 3) => void;
  setElement: (element: string) => void;
  setUseCustom: (value: boolean) => void;
  setExclusiveCustom: (value: boolean) => void;
  setKeywordSort: (value: KeywordSort) => void;
  addKeywords: (
    words: string[],
    pattern: PatternId,
    subtypeId: string | null,
  ) => { added: number; skipped: number };
  updateKeyword: (
    id: string,
    patch: Partial<Pick<CustomKeyword, "word" | "pattern" | "subtypeId" | "active">>,
  ) => boolean;
  toggleKeyword: (id: string) => void;
  removeKeyword: (id: string) => void;
  clearKeywords: () => void;
  addSubtype: (name: string, parent: PatternId) => CustomSubtype | null;
  updateSubtype: (id: string, name: string) => void;
  removeSubtype: (id: string) => void;
  addType: (name: string) => CustomType | null;
  updateType: (id: string, name: string) => void;
  removeType: (id: string) => void;
  restoreType: (id: string) => void;
  applyProgress: (snapshot: ProgressSnapshot) => void;
  roll: () => { ok: true } | { ok: false; reason: string };
  save: (idea: Idea) => void;
  remove: (id: string) => void;
  clearArchive: () => void;
};

export function snapshotOf(s: State): ProgressSnapshot {
  return {
    patterns: s.patterns,
    subtypeFilters: s.subtypeFilters,
    count: s.count,
    batch: s.batch,
    element: s.element,
    ideas: s.ideas,
    archive: s.archive,
    customKeywords: s.customKeywords,
    subtypes: s.subtypes,
    customTypes: s.customTypes,
    hiddenTypes: s.hiddenTypes,
    useCustom: s.useCustom,
    exclusiveCustom: s.exclusiveCustom,
    keywordSort: s.keywordSort,
  };
}

const saved = loadProgress() ?? EMPTY_PROGRESS;

export const useAleas = create<State>((set, get) => ({
      patterns: saved.patterns,
      subtypeFilters: saved.subtypeFilters,
      count: saved.count,
      batch: saved.batch,
      element: saved.element,
      rolling: false,
      ideas: saved.ideas,
      archive: saved.archive,
      customKeywords: saved.customKeywords,
      subtypes: saved.subtypes,
      customTypes: saved.customTypes,
      hiddenTypes: saved.hiddenTypes,
      useCustom: saved.useCustom,
      exclusiveCustom: saved.exclusiveCustom,
      keywordSort: saved.keywordSort,
      setPatterns: (patterns) => set({ patterns }),
      togglePattern: (id) =>
        set((s) => ({
          patterns: s.patterns.includes(id)
            ? s.patterns.filter((p) => p !== id)
            : [...s.patterns, id],
        })),
      toggleSubtypeFilter: (id) =>
        set((s) => ({
          subtypeFilters: s.subtypeFilters.includes(id)
            ? s.subtypeFilters.filter((p) => p !== id)
            : [...s.subtypeFilters, id],
        })),
      setCount: (count) => set({ count }),
      setBatch: (batch) => set({ batch }),
      setElement: (element) => set({ element }),
      setUseCustom: (useCustom) =>
        set({
          useCustom,
          exclusiveCustom: useCustom ? get().exclusiveCustom : false,
        }),
      setExclusiveCustom: (exclusiveCustom) =>
        set({
          exclusiveCustom,
          useCustom: exclusiveCustom ? true : get().useCustom,
        }),
      setKeywordSort: (keywordSort) => set({ keywordSort }),
      addKeywords: (words, pattern, subtypeId) => {
        const existing = new Set(
          get().customKeywords.map((k) => k.word.toLowerCase()),
        );
        const next: CustomKeyword[] = [];
        let skipped = 0;
        for (const raw of words) {
          const word = normalizeWord(raw);
          if (!word) continue;
          const key = word.toLowerCase();
          if (existing.has(key)) {
            skipped += 1;
            continue;
          }
          existing.add(key);
          next.push({
            id: uid(),
            word,
            pattern,
            subtypeId,
            active: true,
            createdAt: Date.now(),
          });
        }
        if (next.length) {
          set((s) => ({ customKeywords: [...next, ...s.customKeywords] }));
        }
        return { added: next.length, skipped };
      },
      updateKeyword: (id, patch) => {
        const current = get().customKeywords;
        const target = current.find((k) => k.id === id);
        if (!target) return false;
        const word = patch.word !== undefined ? normalizeWord(patch.word) : target.word;
        if (!word) return false;
        if (
          patch.word !== undefined &&
          current.some((k) => k.id !== id && k.word.toLowerCase() === word.toLowerCase())
        ) {
          return false;
        }
        set({
          customKeywords: current.map((k) =>
            k.id === id
              ? {
                  ...k,
                  ...patch,
                  word,
                  subtypeId:
                    patch.subtypeId === undefined ? k.subtypeId : patch.subtypeId,
                }
              : k,
          ),
        });
        return true;
      },
      toggleKeyword: (id) =>
        set((s) => ({
          customKeywords: s.customKeywords.map((k) =>
            k.id === id ? { ...k, active: !k.active } : k,
          ),
        })),
      removeKeyword: (id) =>
        set((s) => ({ customKeywords: s.customKeywords.filter((k) => k.id !== id) })),
      clearKeywords: () => set({ customKeywords: [] }),
      addSubtype: (name, parent) => {
        const trimmed = normalizeWord(name);
        if (!trimmed) return null;
        const exists = get().subtypes.some(
          (s) =>
            s.parent === parent && s.name.toLowerCase() === trimmed.toLowerCase(),
        );
        if (exists) return null;
        const subtype: CustomSubtype = { id: uid(), name: trimmed, parent };
        set((s) => ({ subtypes: [...s.subtypes, subtype] }));
        return subtype;
      },
      updateSubtype: (id, name) => {
        const trimmed = normalizeWord(name);
        if (!trimmed) return;
        set((s) => ({
          subtypes: s.subtypes.map((item) =>
            item.id === id ? { ...item, name: trimmed } : item,
          ),
        }));
      },
      removeSubtype: (id) =>
        set((s) => ({
          subtypes: s.subtypes.filter((item) => item.id !== id),
          subtypeFilters: s.subtypeFilters.filter((item) => item !== id),
          customKeywords: s.customKeywords.map((k) =>
            k.subtypeId === id ? { ...k, subtypeId: null } : k,
          ),
        })),
      addType: (name) => {
        const trimmed = normalizeWord(name);
        if (!trimmed) return null;
        const taken = new Set([
          ...PATTERN_IDS,
          ...get().customTypes.map((t) => t.id),
          ...get().customTypes.map((t) => t.name.toLowerCase()),
        ]);
        if (taken.has(trimmed.toLowerCase())) return null;
        let id = slugify(trimmed);
        if (taken.has(id) || isBuiltIn(id)) id = `${id}-${uid().slice(0, 4)}`;
        const type: CustomType = { id, name: trimmed };
        set((s) => ({ customTypes: [...s.customTypes, type] }));
        return type;
      },
      updateType: (id, name) => {
        const trimmed = normalizeWord(name);
        if (!trimmed) return;
        set((s) => ({
          customTypes: s.customTypes.map((item) =>
            item.id === id ? { ...item, name: trimmed } : item,
          ),
        }));
      },
      removeType: (id) =>
        set((s) => {
          if (isBuiltIn(id)) {
            return {
              hiddenTypes: s.hiddenTypes.includes(id)
                ? s.hiddenTypes
                : [...s.hiddenTypes, id],
              patterns: s.patterns.filter((p) => p !== id),
            };
          }
          return {
            customTypes: s.customTypes.filter((item) => item.id !== id),
            patterns: s.patterns.filter((p) => p !== id),
            subtypes: s.subtypes.filter((item) => item.parent !== id),
            customKeywords: s.customKeywords.map((k) =>
              k.pattern === id ? { ...k, pattern: "objet", subtypeId: null } : k,
            ),
          };
        }),
      restoreType: (id) =>
        set((s) => ({
          hiddenTypes: s.hiddenTypes.filter((item) => item !== id),
        })),
      applyProgress: (snapshot) => set({ ...snapshot, rolling: false }),
      roll: () => {
        const {
          patterns,
          subtypeFilters,
          count,
          batch,
          element,
          customKeywords,
          subtypes,
          hiddenTypes,
          useCustom,
          exclusiveCustom,
        } = get();
        const enabledBuilt = visibleBuiltIns(hiddenTypes);
        const selected = patterns.filter((p) => !hiddenTypes.includes(p));
        const rollPatterns = selected.length > 0 ? selected : [...enabledBuilt];
        const extra: Token[] =
          useCustom || exclusiveCustom
            ? customKeywords
                .filter((k) => k.active && matchCustom(k, selected, subtypeFilters))
                .map((k) => ({
                  word: k.word,
                  pattern: k.pattern,
                  custom: true,
                  subtype: subtypes.find((s) => s.id === k.subtypeId)?.name,
                }))
            : [];

        if (exclusiveCustom && extra.length === 0) {
          return { ok: false as const, reason: "Aucun mot perso actif pour ces filtres." };
        }

        const next = Array.from({ length: batch }, () =>
          generateIdea({
            patterns:
              subtypeFilters.length > 0 && selected.length === 0
                ? []
                : rollPatterns,
            count,
            element,
            extra,
            exclusive:
              exclusiveCustom ||
              (subtypeFilters.length > 0 && selected.length === 0) ||
              (selected.length > 0 && selected.every((p) => !isBuiltIn(p))),
          }),
        ).filter((idea): idea is NonNullable<typeof idea> => idea !== null);

        if (next.length === 0) {
          return { ok: false as const, reason: "Rien à tirer avec ces réglages." };
        }

        set({ rolling: true, ideas: next });
        if (typeof window !== "undefined") {
          window.setTimeout(() => set({ rolling: false }), 720);
        } else {
          set({ rolling: false });
        }
        return { ok: true as const };
      },
      save: (idea) =>
        set((s) => {
          if (s.archive.some((a) => a.id === idea.id)) return s;
          return { archive: [idea, ...s.archive].slice(0, 80) };
        }),
      remove: (id) => set((s) => ({ archive: s.archive.filter((a) => a.id !== id) })),
      clearArchive: () => set({ archive: [] }),
}));

if (typeof window !== "undefined") {
  useAleas.subscribe((state) => {
    saveProgress(snapshotOf(state));
  });
}
