export const categories = [
  { value: "keyboard", label: "鍵盤" },
  { value: "keycap", label: "鍵帽" },
  { value: "stabilizer", label: "衛星軸" },
  { value: "other", label: "其他" }
] as const;

export const categoryLabels = {
  keyboard: "鍵盤",
  keycap: "鍵帽",
  stabilizer: "衛星軸",
  other: "其他"
} as const;

export const conditionOptions = [
  { value: "95", label: "近全新" },
  { value: "85", label: "正常使用痕跡" },
  { value: "70", label: "有明顯使用痕跡" },
  { value: "50", label: "零件或需整理" }
] as const;

export type ListingCategory = keyof typeof categoryLabels;
