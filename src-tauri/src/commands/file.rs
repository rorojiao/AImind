use serde_json::Value;
use std::fs;
use tauri::dialog::FileDialogBuilder;
use tauri::AppHandle;

#[tauri::command]
pub async fn save_mindmap(app: AppHandle, data: Value, path: Option<String>) -> Result<String, String> {
    let save_path = if let Some(p) = path {
        p
    } else {
        // 显示文件保存对话框
        // 注意：在实际应用中需要异步处理对话框
        return Err("File path required".to_string());
    };

    let content = serde_json::to_string_pretty(&data)
        .map_err(|e| format!("Failed to serialize: {}", e))?;

    fs::write(&save_path, content).map_err(|e| format!("Failed to write: {}", e))?;

    Ok(save_path)
}

#[tauri::command]
pub fn load_mindmap(path: String) -> Result<Value, String> {
    let content = fs::read_to_string(&path).map_err(|e| format!("Failed to read: {}", e))?;

    serde_json::from_str(&content).map_err(|e| format!("Failed to parse: {}", e))
}
