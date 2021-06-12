import { App, EditorPosition, MarkdownView, Editor } from "obsidian"
import ObsidianTweaksPlugin from "./main"
import { Direction } from "./Constants"


export class BetterFormatting {
    public app: App
    private plugin: ObsidianTweaksPlugin

    constructor(app: App, plugin: ObsidianTweaksPlugin) {
        this.app = app
        this.plugin = plugin
    }

    toggleWrapper(symbolStart: string, symbolEnd: string): void {
        // Principle:
        // Toggling twice == no-op
        // This is not trivial to achieve :(
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView)
        if (!activeView) {
            return
        }

        const editor = activeView.editor

        let anchor = editor.getCursor("from")
        let head = editor.getCursor("to")

        let wordStart: EditorPosition
        let wordEnd: EditorPosition

        wordStart = editor.cm.findWordAt(anchor).anchor
        wordEnd = editor.cm.findWordAt(head).head

        let textToWrap = editor.getRange(wordStart, wordEnd)

        if (textToWrap.trim() === "") {
            wordStart = anchor
            wordEnd = anchor

            let charBefore = editor.getRange(
                {line: wordStart.line, ch: wordStart.ch - 1},
                {line: wordStart.line, ch: wordStart.ch},
            )

            // We should've wrapped a whole word more but CM word selection
            // is weird.
            // Let's fix
            if (charBefore.trim() !== "") {
                wordStart = editor.cm.findWordAt(
                    {line: wordStart.line, ch: wordStart.ch - 1})
                    .anchor

                }

            // Update textToWrap again
            textToWrap = editor.getRange(wordStart, wordEnd)

        }

        let alreadyWrapped = (
            textToWrap.startsWith(symbolStart) &&
            textToWrap.endsWith(symbolEnd)
        )

        let newText: string
        if (alreadyWrapped) {
            newText = textToWrap.substring(symbolStart.length, textToWrap.length - symbolEnd.length)
        } else {
            newText = symbolStart + textToWrap + symbolEnd
        }

        editor.replaceRange(
            newText,
            {line: wordStart.line, ch: wordStart.ch},
            {line: wordEnd.line, ch: wordEnd.ch},
        )

        if (alreadyWrapped) {
            editor.setSelection(
                {line: anchor.line, ch: anchor.ch - symbolStart.length},
                {line: head.line, ch: head.ch - symbolStart.length}
            )
        } else {
            editor.setSelection(
                {line: anchor.line, ch: anchor.ch + symbolStart.length},
                {line: head.line, ch: head.ch + symbolStart.length}
            )
        }

        return
    }
}