import React, { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

function App() {
  const editorRef = useRef<HTMLDivElement>(null);
  const [offsetX, setOffsetX] = useState(0); // State to store offsetX
  const [offsetY, setOffsetY] = useState(0); // State to store offsetY
  const [path] = useState("C:\\Users\\austi\\projects\\Tauri-App\\Tauri-App\\test.txt"); // Path to the file

  useEffect(() => {
    const loadFileContent = async () => {
      try {
        const filePath = path;
        const content = await invoke<string>("load_file", { path: filePath })
        if (editorRef.current) {
          editorRef.current.innerText = content.toString().replaceAll("&nbsp;", " ").replaceAll("&gt;", ">").replaceAll("&lt;", "<").replaceAll("&amp;", "&").replaceAll("&quot;", "\"").replaceAll("&apos;", "\'"); // Set the file content in the editor
          if (editorRef.current.innerHTML.endsWith('<br>')) {
              editorRef.current.innerHTML = editorRef.current.innerHTML.slice(0, -4) + "<div><br></div>"
          }
        }
      } catch (error) {
        console.error("Failed to load file:", error);
      }
    };

    loadFileContent();
  }, []);

  const handleInput = () => {
    const editor = editorRef.current;
    if (!editor) return;

    const selection = window.getSelection();
    if (!selection) return;

    // Create a temporary span to measure cursor position
    const tempSpan = document.createElement("span");
    tempSpan.textContent = "\u200B"; // Zero-width space
    const range = document.createRange();

    if (selection.rangeCount > 0) {
      range.setStart(selection.getRangeAt(0).startContainer, selection.getRangeAt(0).startOffset);
    } else {
      // If no selection, use the end of the editor content
      range.selectNodeContents(editor);
      range.collapse(false);
    }

    range.insertNode(tempSpan);
    const rect = tempSpan.getBoundingClientRect();
    const editorRect = editor.getBoundingClientRect();
    const cursorX = rect.left - editorRect.left;
    const cursorY = rect.top - editorRect.top;
    tempSpan.remove();

    const centerX = editorRect.width / 2;
    const centerY = editorRect.height / 2;
    const calculatedOffsetX = centerX - cursorX;
    const calculatedOffsetY = centerY - cursorY;

    setOffsetX(calculatedOffsetX); // Save offsetX in state
    setOffsetY(calculatedOffsetY); // Save offsetY in state
    load_line_numbers(calculatedOffsetX, calculatedOffsetY); // Pass offsetX and offsetY to load_line_numbers
  };

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === "Tab") {
      e.preventDefault();
      document.execCommand("insertText", false, "    "); // Insert 4 spaces
    }

    if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      const ret = await invoke<number>("save_file", { path: path, contents: editorRef.current?.innerHTML.replaceAll("<br>", "\n").replaceAll("<div>", "").replaceAll("</div>", "\n") })   
      if (ret !== 0) {
        console.error("Failed to save file:", ret);
      }
    }  

    handleInput();
  };

  const load_line_numbers = (calculatedOffsetX: number, calculatedOffsetY: number) => {
    const editor = editorRef.current;
    if (!editor) return;

    const lineNumbers = document.querySelector(".line-numbers") as HTMLDivElement;
    let lines = editor.innerHTML.split(/(?<!<div>)<br>|<div>/).length;

    lineNumbers.innerHTML = Array.from({ length: lines }, (_, i) => `<span style="color: #777">${i + 1}</span>`).join("");

    // Adjust the height of the line numbers to match the editor
    lineNumbers.style.height = `${editor.scrollHeight}px`;

    // Use top and transform to position the line-numbers div
    lineNumbers.style.position = "absolute";
    lineNumbers.style.transform = `translate(${calculatedOffsetX - 200}px, ${calculatedOffsetY }px)`; // Adjust based on cursor X and Y
  };

  return (
    <main className="structure">
      <div className="line-numbers glow-text"></div>
      <div className="container">
        <div
          ref={editorRef}
          className="glow-text"
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyUp={handleInput}
          onMouseUp={handleInput}
          onKeyDown={handleKeyDown}
          style={{
            transform: `translate(${offsetX}px, ${offsetY}px)`, // Apply transform to editor
          }}
          spellCheck={false}
        >
          Loading...
        </div>
      </div>
    </main>
  );
}

export default App;