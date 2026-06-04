"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const path = require("path");
const vscode = require("vscode");
function activate(context) {
    const disposable = vscode.commands.registerCommand('opsxExplorer.explore', async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders?.map(folder => folder.uri.fsPath).join('\n') ?? 'No workspace folders open.';
        const choice = await vscode.window.showInformationMessage('OpsX Explorer is ready. What would you like to do?', 'Show workspace path', 'Open requirement.md', 'Show available commands');
        if (choice === 'Show workspace path') {
            vscode.window.showInformationMessage(`Workspace folders:\n${workspaceFolders}`);
        }
        else if (choice === 'Open requirement.md') {
            if (!vscode.workspace.workspaceFolders?.length) {
                vscode.window.showErrorMessage('No workspace folder is open.');
                return;
            }
            const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
            const filePath = path.join(workspaceRoot, 'requirement.md');
            const fileUri = vscode.Uri.file(filePath);
            try {
                await vscode.window.showTextDocument(fileUri);
            }
            catch (error) {
                vscode.window.showErrorMessage('Could not open requirement.md. Make sure the file exists.');
            }
        }
        else if (choice === 'Show available commands') {
            vscode.commands.executeCommand('workbench.action.showCommands');
        }
    });
    context.subscriptions.push(disposable);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map