const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

var lastFolder = '';
var lastWorkspaceName = '';
var lastWorkspaceRoot = '';

const vendor = 'vendor';

const showError = message => vscode.window.showErrorMessage(`Search vendor: ${message}`);

exports.activate = context => {
    const searchVendor = vscode.commands.registerCommand('extension.search_vendor', () => {
        const preferences = vscode.workspace.getConfiguration('search-vendor');

        const useLastFolder = preferences.get('useLastFolder', false);
        const vendorPath = preferences.get('path', vendor);

        const searchPath = (workspaceName, workspaceRoot, folderPath) => {
            // Path to vendor in this workspace folder
            const workspaceVendor = path.join(workspaceName, vendorPath);

            // Reset last folder
            lastFolder = '';
            lastWorkspaceName = '';
            lastWorkspaceRoot = '';

            // Path to current folder
            const folderFullPath = path.join(workspaceRoot, folderPath);

            // Read folder, built quick pick with files/folder (and shortcuts)
            fs.readdir(folderFullPath, (readErr, files) => {
                if (readErr) {
                    if (folderPath === vendorPath) {
                        return showError('No vendor folder in this workspace.');
                    }

                    return showError(`Unable to open folder ${folderPath}`);
                }

                if (folderPath !== vendorPath) {
                    files.push('');
                    files.push(workspaceVendor);
                    files.push('..');
                }

                vscode.window.showQuickPick(files, {
                    placeHolder: path.join(workspaceName, folderPath)
                })
                .then(selected => {
                    // vendor shortcut selected
                    if (selected === workspaceVendor) {
                        searchPath(workspaceName, workspaceRoot, vendorPath);
                    } else {
                        const selectedPath = path.join(folderPath, selected);
                        const selectedFullPath = path.join(workspaceRoot, selectedPath);

                        // If selected is a folder, traverse it,
                        // otherwise open file.
                        fs.stat(selectedFullPath, (statErr, stats) => {
                            if (stats.isDirectory()) {
                                searchPath(workspaceName, workspaceRoot, selectedPath);
                            } else {
                                lastWorkspaceName = workspaceName;
                                lastWorkspaceRoot = workspaceRoot;
                                lastFolder = folderPath;

                                vscode.workspace.openTextDocument(selectedFullPath, selectedPath)
                                .then(vscode.window.showTextDocument);
                            }
                        });
                    }
                });
            });
        };

        // Open last folder if there is one
        if (useLastFolder && lastFolder) {
            return searchPath(lastWorkspaceName, lastWorkspaceRoot, lastFolder);
        }

        // Must have at least one workspace folder
        if (!vscode.workspace.workspaceFolders.length) {
            return showError('You must have a workspace opened.');
        }

        // If in a multifolder workspace, prompt user to select which one to traverse.
        if (vscode.workspace.workspaceFolders.length > 1) {
            vscode.window.showQuickPick(vscode.workspace.workspaceFolders.map(folder => ({
                label: folder.name,
                folder
            })), {
                placeHolder: 'Select workspace folder'
            })
                .then(selected => {
                    if (selected) {
                        searchPath(selected.label, selected.folder.uri.fsPath, vendorPath);
                    }
                });
        } else {
            // Otherwise, use the first one
            const folder = vscode.workspace.workspaceFolders[0];
            searchPath(folder.name, folder.uri.fsPath, vendorPath);
        }
    });

    context.subscriptions.push(searchVendor);
};

exports.deactivate = () => {};
