import {
  Editor,
  MarkdownView,
  Notice,
  Plugin,
  TFile,
} from "obsidian";

export default class M0rtynPlugin extends Plugin {
  isCodeBlock = false;
  isFrontMatter = false;
  isComment = false;

  async onload() {
    const that = this;
    this.addCommand({
      id: 'm0rtyn-lint-file',
      name: "Lint File (Custom)",
      editorCheckCallback(checking, editor, ctx) {
        if (checking) {
          if (!ctx.file) return;
          return that.isMarkdownFile(ctx.file);
        }

        try {
          void that.runLinterEditor(editor);
        } catch (error) {
          console.error(error);
        }
      },
    });
  }
  
  async runLinterEditor(editor: Editor) {
    const file = this.app.workspace.getActiveFile();
    const oldText = editor.getValue();
    let newText: string;

    try {
      newText = this.lintText(oldText);
    } catch (error) {
      console.error(error);
      return;
    }

    // TODO: add more informative messages about what was changed (linke in Linter plugin)
    this.displayChangedMessage();

    if (!file) return
    this.updateFileDebouncerText(file, newText);
  }

  lintText(text: string): string {
    const lines = text.split("\n");

    const newText = lines
      .map((l) => {
        const newLine = this.lintLine(l)
        // console.log("line: ", l, "\nnewLine: ", newLine);
        return newLine
      });

    return newText.join("\n");
  }

  lintLine(line: string): string {
    const indentPattern = '^(( {2})*)';
    /** ignore code blocks by setting a flag */
    if (line.match(`${indentPattern}\\\`\\\`\\\`(\\w+)?`)) {
      this.isCodeBlock = !this.isCodeBlock;
      return line;
    }
    
    /** ignore frontmatter block by setting a flag */
    if (line.match("^--- *$") && !this.isCodeBlock) {
      this.isFrontMatter = !this.isFrontMatter;
      return line;
    }

    // if (line.match("\%\%")) {
    //   console.log(this.isComment, line, line.match("^ *\%\%.*$"), line.match("^.*\%\% *$"))
    // }
    // FIXME: bug with comments in code blocks
    /** ignore comment block by setting a flag */
    if (line.match("^ *[%]{2}[^%]*$")) {
      this.isComment = !this.isComment
      return line;
    }

    
    if (
      (this.isCodeBlock || this.isFrontMatter)
      || line === "" // ignore empty lines
      || line.match(`${indentPattern}- `) // ignore list items
      || line.match(`${indentPattern}\\d{1,4}\\. `) // ignore  ordered lists
      || line.startsWith("#") // ignore headers
      || line.startsWith(">") // ignore blockquotes
      || line.startsWith("| ") // ignore tables
      || line.match(`^%%.*%%$`) // ignore inline comments
      || line.match(`${indentPattern}([-_*] ?){3,} `) // ignore horizontal rules
    ) return line;
    
    // console.log("line: ", line, );
    return line.replace(new RegExp(indentPattern), "$1- ");
  }


  isMarkdownFile(file: TFile): boolean {
    return file && file.extension === 'md';
  }

  updateFileDebouncerText(file: TFile, text: string) {
    this.app.vault.modify(file, text);
  }

  private displayChangedMessage(charsAdded?: number, charsRemoved?: number) {
      // const message = `
      //   ${charsAdded} chars added
      //   ${charsRemoved} chars removed')}
      // `;
      const message = `
        Linting complete
      `;
      new Notice(message);
  }

  // private updateEditor(oldText: string, newText: string, editor: Editor): DiffMatchPatch.Diff[] {
  //   const dmp = new DiffMatchPatch.diff_match_patch(); // eslint-disable-line new-cap
  //   const changes = dmp.diff_main(oldText, newText);
  //   let curText = '';
  //   changes.forEach((change) => {
  //     const [type, value] = change;

  //     if (type == DiffMatchPatch.DIFF_INSERT) {
  //       // use codemirror dispatch in order to bypass the filter on transactions that causes editor.replaceRange not to not work in Live Preview
  //       editor.cm.dispatch({
  //         changes: [{
  //           from: editor.posToOffset(this.endOfDocument(curText)),
  //           insert: value,
  //         } as ChangeSpec],
  //         filter: false,
  //       });
  //       curText += value;
  //     } else if (type == DiffMatchPatch.DIFF_DELETE) {
  //       const start = this.endOfDocument(curText);
  //       let tempText = curText;
  //       tempText += value;
  //       const end = this.endOfDocument(tempText);

  //       // use codemirror dispatch in order to bypass the filter on transactions that causes editor.replaceRange not to not work in Live Preview
  //       editor.cm.dispatch({
  //         changes: [{
  //           from: editor.posToOffset(start),
  //           to: editor.posToOffset(end),
  //           insert: '',
  //         } as ChangeSpec],
  //         filter: false,
  //       });
  //     } else {
  //       curText += value;
  //     }
  //   });

  //   return changes;
  // }
}