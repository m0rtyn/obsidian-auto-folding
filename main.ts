import {
	MarkdownView,
	Plugin,
} from "obsidian";

export default class AutoFoldingPlugin extends Plugin {
	async onload() {
		this.app.workspace.on("active-leaf-change", (file) => {
			const activeView =
				this.app.workspace.getActiveViewOfType(MarkdownView);

			if (activeView) {
				const cursor = activeView.editor.getCursor();
				activeView.editor.exec("foldAll");

				console.log(activeView?.file);
				const line = activeView?.file?.name === "Log.md" 
					? activeView.editor.lastLine() 
					: cursor.line;
				activeView.editor.setCursor({
					line,
					ch: 0,
				});
				console.log("Scrolling to: ", line);
				
				activeView.editor.exec("toggleFold");
			}
		});
	}
}
