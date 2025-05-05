// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::io::Read;


fn load_file(path: &str) -> String {
    let mut file = fs::File::open(path).expect("Unable to open file");
    let mut contents = String::new();
    file.read_to_string(&mut contents).expect("Unable to read file");
    contents
}

fn main() {
    tauri_app_lib::run()
}
