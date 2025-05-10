// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::io::Read;
use tauri::command;
use std::io::Write;
use std::process::Command;

#[command]
fn load_file(path: &str) -> Result<String, String> {
    let mut file = fs::File::open(path).map_err(|_| "Unable to open file".to_string())?;
    let mut contents = String::new();
    file.read_to_string(&mut contents).map_err(|_| "Unable to read file".to_string())?;
    Ok(contents)
}

#[command]
fn save_file(path: &str, contents: &str) -> i32 {
    let mut file = match fs::File::create(path) {
        Ok(f) => f,
        Err(_) => return 1,
    };

    if file.write_all(contents.as_bytes()).is_err() {
        return 1; 
    }

    0
}

#[command]
fn run(path: &str) -> Vec<String> {
    let process = Command::new("powershell.exe")
    .args(&["-File", "C:\\Users\\austi\\projects\\Tauri-App\\Tauri-App\\General.ps1", "-NoProfile", "-ExecutionPolicy", "ByPass", path])
    .output()
    .expect("Failed to execute process");

    vec![String::from_utf8_lossy(&process.stdout).to_string(), String::from_utf8_lossy(&process.stderr).to_string()]
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![load_file, save_file, run]) // Register the command here
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}