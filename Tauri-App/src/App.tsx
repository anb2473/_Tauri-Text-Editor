import React, { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

function App() {
  const editorRef = useRef<HTMLDivElement>(null);
  const [offsetX, setOffsetX] = useState(0); // State to store offsetX

  useEffect(() => {
    const loadFileContent = async () => {
      try {
        const filePath = "C:\\Users\\austi\\projects\\Tauri-App\\Tauri-App\\index.html"; // Replace with your test file path
        const content = await invoke<string>("load_file", { path: filePath });
        if (editorRef.current) {
          editorRef.current.innerText = content; // Set the file content in the editor
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
    tempSpan.remove();

    const centerX = editorRect.width / 2;
    const calculatedOffsetX = centerX - cursorX;

    setOffsetX(calculatedOffsetX); // Save offsetX in state
    load_line_numbers(calculatedOffsetX); // Pass offsetX to load_line_numbers
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Tab") {
      e.preventDefault();
      document.execCommand("insertText", false, "    "); // Insert 4 spaces
    }
  };

  const load_line_numbers = (calculatedOffsetX: number) => {
    const editor = editorRef.current;
    if (!editor) return;

    const lineNumbers = document.querySelector(".line-numbers") as HTMLDivElement;
    const lines = editor.innerText.split("\n").length;
    lineNumbers.innerHTML = Array.from({ length: lines }, (_, i) => `<span style="color: #777">${i + 1}</span>`).join("");

    // Adjust the height of the line numbers to match the editor
    lineNumbers.style.height = `${editor.scrollHeight}px`;

    // Use top and transform to position the line-numbers div
    const editorRect = editor.getBoundingClientRect();
    lineNumbers.style.position = "absolute";
    lineNumbers.style.top = `${editorRect.top}px`;
    lineNumbers.style.transform = `translateX(${calculatedOffsetX - (lines.toString().length*25 + 200)}px)`; // Use offsetX for horizontal positioning
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
          style={{ transform: `translateX(${offsetX}px)` }} // Apply transform to editor
          spellCheck={false}
        >
          Loading...
        </div>
      </div>
    </main>
  );
}

export default App;