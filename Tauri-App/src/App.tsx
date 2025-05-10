import React, { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

function App() {
  const editorRef = useRef<HTMLDivElement>(null);
  const [offsetX, setOffsetX] = useState(0); // State to store offsetX
  const [offsetY, setOffsetY] = useState(0); // State to store offsetY
  const [path] = useState("C:\\Users\\austi\\projects\\Tauri-App\\Tauri-App\\test.py"); // Path to the file
  const [isHeaderVisible, setIsHeaderVisible] = useState(false);

  useEffect(() => {
    const loadFileContent = async () => {
      try {
        const filePath = path;
        const content = await invoke<string>("load_file", { path: filePath });
  
        if (editorRef.current) {
          // Replace spaces and tabs with their HTML equivalents to preserve formatting
          const formattedContent = content
            .replace(/\n/g, "<br>")
            .replace(/ /g, "&nbsp;") // Replace spaces with non-breaking spaces
            .replace(/\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;"); // Replace tabs with 4 non-breaking spaces
  
          editorRef.current.innerHTML = formattedContent; // Set the file content in the editor
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
  
    // Save the current selection (cursor position)
    const selection = window.getSelection();
    const range = selection?.getRangeAt(0);
    const startOffset = range?.startOffset || 0;
    const startContainer = range?.startContainer;
  
    // Only sanitize content if necessary (e.g., when specific tags are detected)
    if (editor.innerHTML.includes("<div>") || editor.innerHTML.includes("<span")) {
      editor.innerHTML = editor.innerHTML
        .replace(/<div>/g, "<br>") // Replace <div> with <br>
        .replace(/<\/div>/g, "") // Remove closing </div>
        .replace(/<span[^>]*>/g, "") // Remove opening <span> tags
        .replace(/<\/span>/g, ""); // Remove closing </span>
  
      // Restore the cursor position
      if (selection && startContainer) {
        const newRange = document.createRange();
        newRange.setStart(startContainer, Math.min(startOffset, startContainer.textContent?.length || 0));
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
    }
  
    // Additional logic for measuring cursor position (if needed)
    const tempSpan = document.createElement("span");
    tempSpan.textContent = "\u200B"; // Zero-width space
    const tempRange = document.createRange();
  
    if (selection?.rangeCount > 0) {
      tempRange.setStart(selection.getRangeAt(0).startContainer, selection.getRangeAt(0).startOffset);
    } else {
      tempRange.selectNodeContents(editor);
      tempRange.collapse(false);
    }
  
    tempRange.insertNode(tempSpan);
  
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
    const editor = editorRef.current;
    if (!editor) return;
  
    // Handle Tab Key
    if (e.key === "Tab") {
      e.preventDefault();
      document.execCommand("insertText", false, "    "); // Insert 4 spaces
    }
  
    // Handle Enter Key
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent the default <div> behavior
  
      const selection = window.getSelection();
      if (!selection) return;
  
      const range = selection.getRangeAt(0);
      const br = document.createElement("br");
      range.deleteContents(); // Remove any selected content
      range.insertNode(br); // Insert a <br> tag
      range.collapse(false); // Move the cursor after the <br>
  
      // Ensure the cursor is placed correctly
      selection.removeAllRanges();
      selection.addRange(range);
    }
  
    // CTRL + S Save
    if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      const contents = editor.innerHTML
        .replaceAll("&nbsp;", " ")
        .replaceAll("&gt;", ">")
        .replaceAll("&lt;", "<")
        .replaceAll("&amp;", "&")
        .replaceAll("&quot;", "\"")
        .replaceAll("&apos;", "'")
        .replaceAll("<br>", "\n")
        .replaceAll("<div>", "")
        .replaceAll("</div>", "\n");
  
      const ret = await invoke<number>("save_file", { path: path, contents });
      if (ret !== 0) {
        console.error("Failed to save file:", ret);
      }
    }
  
    // CTRL + Space Run
    if (e.key === " " && (e.ctrlKey || e.metaKey)) {
      const contents = editor.innerHTML
        .replaceAll("&nbsp;", " ")
        .replaceAll("&gt;", ">")
        .replaceAll("&lt;", "<")
        .replaceAll("&amp;", "&")
        .replaceAll("&quot;", "\"")
        .replaceAll("&apos;", "'")
        .replaceAll("<br>", "\n")
        .replaceAll("<div>", "")
        .replaceAll("</div>", "\n");
  
      const ret = await invoke<number>("save_file", { path: path, contents });
      if (ret !== 0) {
        console.error("Failed to save file:", ret);
      }

      const std: string[] = await invoke<number>("run", {
        path: path,
        contents: editor.innerHTML
          .replaceAll("&nbsp;", " ")
          .replaceAll("&gt;", ">")
          .replaceAll("&lt;", "<")
          .replaceAll("&amp;", "&")
          .replaceAll("&quot;", "\"")
          .replaceAll("&apos;", "'")
          .replaceAll("<br>", "\n")
          .replaceAll("<div>", "")
          .replaceAll("</div>", "\n"),
      });
      console.log(std);

      setIsHeaderVisible(true);

      const stdOut = document.getElementById("std-out");
      if (!stdOut) return;
      if (std[0] !== "") {
        stdOut.textContent = std[0];
        stdOut.style.visibility = "visible"; 
      }
      else {
        stdOut.style.visibility = "hidden"; 
      }
  
      const stdErr = document.getElementById("std-err");
      if (!stdErr) return;
      if (std[1] !== "") {
        stdErr.textContent = std[1];
        stdErr.style.visibility = "visible"; 
      }
      else {
        stdErr.style.visibility = "hidden"; 
      }
    }

    if (e.key === "u" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      setIsHeaderVisible(true);
    }

    if (e.key === "k" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      setIsHeaderVisible(true);

      const stdOut = document.getElementById("std-out");
      if (!stdOut) return;
      stdOut.style.visibility = "visible"; 
      stdOut.innerHTML = `
      # Key Bindings (Note, if you want to edit these please edit the settings.json)<br>
      &nbsp;&nbsp;* CTRL + S: Save File<br>
      &nbsp;&nbsp;* CTRL + Space: Run File<br>
      &nbsp;&nbsp;* CTRL + U: Show Output Overlay<br>
      &nbsp;&nbsp;* CTRL + X: Hide Output Overlay<br>
      &nbsp;&nbsp;* CTRL + K: View Key Bindings<br>
      `;

      const stdErr = document.getElementById("std-err");
      if (!stdErr) return;
      stdErr.style.visibility = "hidden";
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

  // Req: Visualize STDOUT STDERR On all run functions (Save file, load file, delete, run general etc) impl: header flex space between
  // Half transparent header, or full overlay with stdout and stderr labled
  return (
    <main className="structure">
     <div
      id="std-header"
      className={isHeaderVisible ? "visible" : ""} // Toggle the "visible" class
      tabIndex={0} // Make the div focusable
      onKeyDown={(e) => {
        if (e.key === "x" && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          // console.log("Hiding header");
          // e.currentTarget.style.visibility = "hidden"; // Hide the header
          setIsHeaderVisible(false); // Hide the header
        }
      }}
    >
      <div
        id="std-out"
        className="base-glow-text"
        style={{
          margin: "10px 0",
          width: "100%", // Take full width of the header
          maxHeight: "400px", // Limit the height
          overflow: "auto", // Enable scrolling if content overflows
          padding: "10px", // Add padding inside the box
          backgroundColor: "rgba(255, 255, 255, 0.1)", // Optional: Add a background for better visibility
          borderRadius: "10px", // Rounded edges for the box
          scrollbarWidth: "none",
        }}
      ></div>
      <div
        id="std-err"
        className="base-glow-text"
        style={{
          margin: "10px 0",
          width: "100%", // Take full width of the header
          maxHeight: "400px", // Limit the height
          overflow: "auto", // Enable scrolling if content overflows
          padding: "10px", // Add padding inside the box
          backgroundColor: "rgba(255, 255, 255, 0.1)", // Optional: Add a background for better visibility
          borderRadius: "10px", // Rounded edges for the box
          color: "rgb(145, 30, 30)", // Red color for STDERR
          scrollbarWidth: "none",
        }}
      ></div>
    </div>

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