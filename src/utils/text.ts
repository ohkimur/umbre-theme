import { capitalCase, kebabCase } from "change-case";

export const titleCase = (value: string): string => capitalCase(value);

export const slug = (parts: readonly string[]): string => kebabCase(parts.filter(Boolean).join(" "));
