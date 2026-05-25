import { execa } from "execa";

export type CommandOptions = {
  cwd?: string;
};

export const runCommand = async (
  command: string,
  args: string[],
  options: CommandOptions = {},
): Promise<void> => {
  await execa(command, args, {
    ...(options.cwd ? { cwd: options.cwd } : {}),
    stdio: "inherit",
  });
};
