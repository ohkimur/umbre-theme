import { writeText } from "@/utils/fs.ts";

export const stringifyJson = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;

export const writeJson = async (path: URL, value: unknown): Promise<void> => {
  await writeText(path, stringifyJson(value));
};
