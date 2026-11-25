import Editor, { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import EditorWorker from "monaco-editor/editor/editor.worker.js?worker";
import CssWorker from "monaco-editor/language/css/css.worker.js?worker";
import HtmlWorker from "monaco-editor/language/html/html.worker.js?worker";
import JsonWorker from "monaco-editor/language/json/json.worker.js?worker";
import TypeScriptWorker from "monaco-editor/language/typescript/ts.worker.js?worker";
self.MonacoEnvironment = {
  getWorker: (_, label) =>
    label === "typescript" || label === "javascript"
      ? new TypeScriptWorker()
      : label === "json"
        ? new JsonWorker()
        : label === "css"
          ? new CssWorker()
          : label === "html"
            ? new HtmlWorker()
            : new EditorWorker(),
};
loader.config({ monaco });
export default function CodeEditor({
  value,
  onChange,
  language = "plaintext",
  readOnly = false,
  fontSize = 14,
  wordWrap = true,
}: {
  value: string;
  onChange?: (value: string) => void;
  language?: string;
  readOnly?: boolean;
  fontSize?: number;
  wordWrap?: boolean;
}) {
  return (
    <Editor
      height="min(58vh, 580px)"
      language={language}
      value={value}
      onChange={(v) => onChange?.(v || "")}
      theme={["c", "d"].includes(document.documentElement.dataset.theme ?? "") ? "vs-dark" : "vs"}
      loading={<p className="editor-loading">Loading code editor…</p>}
      options={{
        ariaLabel: readOnly ? "Snippet code viewer" : "Snippet code editor",
        readOnly,
        minimap: { enabled: false },
        fontFamily: "JetBrains Mono, monospace",
        fontSize,
        lineNumbers: "on",
        wordWrap: wordWrap ? "on" : "off",
        scrollBeyondLastLine: false,
        padding: { top: 18, bottom: 18 },
        automaticLayout: true,
        tabSize: 2,
        renderLineHighlight: readOnly ? "none" : "line",
        overviewRulerLanes: 0,
      }}
    />
  );
}
