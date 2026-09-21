import { dirname } from "node:path";

import { product } from "@/product.ts";
import * as vscode from "vscode";

export type Recommendation = {
  id: string;
  name: string;
  pitch: string;
  /** Extension that must be enabled for the recommendation to be in effect; defaults to `id`. */
  checkId?: string;
};

/** `unknown` when this window cannot see the whole install: remote hosts and non-default profiles. */
type ExtensionState = "enabled" | "disabled" | "missing" | "unknown";

type InstalledExtensionRecord = {
  identifier?: { id?: unknown };
};

const dismissAction = "Not now";
const dismissedThisSession = new Set<string>();

/**
 * Offers a recommended extension once per session: install it when missing, point to Enable when it
 * is installed but disabled. Resolves to whether the extension is already enabled or was just installed.
 */
export const recommendExtension = async (
  context: vscode.ExtensionContext,
  recommendation: Recommendation,
): Promise<"enabled" | "installed" | "declined"> => {
  const state = await extensionState(context, recommendation.checkId ?? recommendation.id);
  if (state === "enabled") return "enabled";
  if (dismissedThisSession.has(recommendation.id)) return "declined";
  // Claimed before prompting, so overlapping calls offer each extension once per session.
  dismissedThisSession.add(recommendation.id);

  const { id, name, pitch } = recommendation;
  const checkId = recommendation.checkId ?? id;
  const pairing = `${product.displayName} pairs well with ${name}, ${pitch}.`;
  const [message, action] =
    state === "missing"
      ? [pairing, `Install ${name}`]
      : state === "disabled"
        ? [
            `${name} is installed but disabled. Enable it to use it with ${product.displayName}.`,
            `Enable ${name}`,
          ]
        : [pairing, `Show ${name}`];

  const choice = await vscode.window.showInformationMessage(message, action, dismissAction);
  if (choice !== action) return "declined";

  if (state === "missing") {
    await vscode.window.withProgress(
      { location: vscode.ProgressLocation.Notification, title: `Installing ${name}...` },
      () => vscode.commands.executeCommand("workbench.extensions.installExtension", id),
    );
    return "installed";
  }

  // VS Code has no command to enable one extension; its page puts Enable (or Install) one click away.
  await vscode.commands.executeCommand("extension.open", state === "disabled" ? checkId : id);
  return "declined";
};

export const resetRecommendationsForTests = (): void => {
  dismissedThisSession.clear();
};

/**
 * VS Code only exposes enabled extensions. A disabled one is still listed in the `extensions.json`
 * manifest of the default profile's extensions folder, so read that to tell "disabled" from "missing".
 */
const extensionState = async (context: vscode.ExtensionContext, id: string): Promise<ExtensionState> => {
  if (vscode.extensions.getExtension(id) !== undefined) return "enabled";
  if (vscode.env.remoteName || isNonDefaultProfile(context)) return "unknown";

  const installed = await installedExtensionIds();
  if (!installed) return "unknown";
  return installed.has(id.toLowerCase()) ? "disabled" : "missing";
};

/** Non-default profiles keep their own extension inventory, outside the shared manifest. */
const isNonDefaultProfile = (context: vscode.ExtensionContext): boolean =>
  context.globalStorageUri.path.includes("/profiles/");

const installedExtensionIds = async (): Promise<Set<string> | undefined> => {
  const folder = userExtensionsFolder();
  if (!folder) return undefined;

  try {
    const manifest = await vscode.workspace.fs.readFile(vscode.Uri.joinPath(folder, "extensions.json"));
    const records = JSON.parse(Buffer.from(manifest).toString("utf8")) as InstalledExtensionRecord[];
    return new Set(
      records.flatMap((record) =>
        typeof record.identifier?.id === "string" ? [record.identifier.id.toLowerCase()] : [],
      ),
    );
  } catch {
    return undefined;
  }
};

/** The folder holding user-installed extensions, found through any enabled non-built-in extension. */
const userExtensionsFolder = (): vscode.Uri | undefined => {
  const extension = vscode.extensions.all.find(
    (candidate) => !(candidate.packageJSON as { isBuiltin?: boolean } | undefined)?.isBuiltin,
  );
  return extension?.extensionUri.with({ path: dirname(extension.extensionUri.path) });
};
