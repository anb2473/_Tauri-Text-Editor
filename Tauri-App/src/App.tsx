import React from 'react';
import { useEffect, useRef, useState } from "react";
import { invoke } from '@tauri-apps/api/core';
import "./App.css";

function App() {
  const editorRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState("");

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
    const tempSpan = document.createElement('span');
    tempSpan.textContent = '\u200B'; // Zero-width space
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
    const offsetX = centerX - cursorX;
    
    setTransform(`translateX(${offsetX}px)`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      document.execCommand('insertText', false, '    '); // Insert 4 spaces
    }
  };

  return (
    <main className="container">
      <div 
        ref={editorRef}
        className="glow-text"
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyUp={handleInput}
        onMouseUp={handleInput}
        onKeyDown={handleKeyDown}
        style={{ transform }}
        spellCheck={false}
      >
        Loading...
      </div>
    </main>      
  );
}

export default App;
