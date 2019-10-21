'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var vscode = require("vscode");
var nginx = require("nginx-conf");
function activate(context) {
    // 👍 formatter implemented using API
    vscode.languages.registerDocumentFormattingEditProvider('NGINX', {
        provideDocumentFormattingEdits: function (document) {
            var promise = new Promise(function (resolve, reject) {
                nginx.parse(document.getText(), function (error, tree) {
                    if (error != null) {
                        vscode.window.showErrorMessage("Unable to parse Document: " + error);
                        reject("Unable to parse Document: " + error);
                        return;
                    }
                    var text = (new nginx.NginxConfFile(tree)).toString();
                    var firstLine = document.lineAt(0);
                    var lastLine = document.lineAt(document.lineCount - 1);
                    var range = new vscode.Range(0, firstLine.range.start.character, document.lineCount - 1, lastLine.range.end.character);
                    resolve([vscode.TextEdit.replace(range, text)]);
                });
            });
            return promise;
        }
    });
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map