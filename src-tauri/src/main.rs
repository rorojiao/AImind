// Prevents additional console window on Windows in release builds
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod services;

use commands::{ai, config, file};
use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // AI命令
            ai::ai_chat,
            ai::ai_expand_node,
            ai::ai_analyze_mindmap,
            // 配置命令
            config::get_ai_configs,
            config::save_ai_config,
            config::delete_ai_config,
            config::set_current_provider,
            // 文件命令
            file::save_mindmap,
            file::load_mindmap,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
