// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::io::Read;
use tauri::command;

#[command]
fn load_file(path: &str) -> Result<String, String> {
    let mut file = fs::File::open(path).map_err(|_| "Unable to open file".to_string())?;
    let mut contents = String::new();
    file.read_to_string(&mut contents).map_err(|_| "Unable to read file".to_string())?;
    Ok(contents)
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![load_file]) // Register the command here
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}