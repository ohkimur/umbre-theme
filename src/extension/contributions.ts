export type CommandContribution = {
  command: string;
  title: string;
  category: string;
};

export const commandContributions = (): CommandContribution[] => [
  {
    command: "umbre.configure",
    title: "Configure Theme",
    category: "Umbre",
  },
  {
    command: "umbre.toggleMode",
    title: "Toggle Opposite Dark/Light Mode",
    category: "Umbre",
  },
];
