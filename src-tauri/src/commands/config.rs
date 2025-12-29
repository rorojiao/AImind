use crate::models::config::{AIConfig, AIProvider};
use dirs::home_dir;
use serde_json;
use std::fs;
use std::path::PathBuf;

fn config_path() -> Result<PathBuf, String> {
    let mut path = home_dir().ok_or("Cannot find home directory")?;
    path.push(".aimind");
    path.push("config.json");
    Ok(path)
}

pub fn load_configs() -> Result<AIConfig, String> {
    let path = config_path()?;

    if !path.exists() {
        // 创建默认配置
        let config = AIConfig::default();
        save_configs(&config)?;
        return Ok(config);
    }

    let content = fs::read_to_string(&path).map_err(|e| format!("Failed to read config: {}", e))?;
    serde_json::from_str(&content).map_err(|e| format!("Failed to parse config: {}", e))
}

pub fn save_configs(config: &AIConfig) -> Result<(), String> {
    let path = config_path()?;

    // 确保目录存在
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Failed to create config dir: {}", e))?;
    }

    let content = serde_json::to_string_pretty(config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;

    fs::write(&path, content).map_err(|e| format!("Failed to write config: {}", e))
}

#[tauri::command]
pub fn get_ai_configs() -> Result<AIConfig, String> {
    load_configs()
}

#[tauri::command]
pub fn save_ai_config(config: AIProvider) -> Result<(), String> {
    let mut configs = load_configs()?;

    // 查找并更新或添加新配置
    if let Some(existing) = configs.providers.iter_mut().find(|p| p.id == config.id) {
        *existing = config;
    } else {
        configs.providers.push(config);
    }

    save_configs(&configs)
}

#[tauri::command]
pub fn delete_ai_config(id: String) -> Result<(), String> {
    let mut configs = load_configs()?;

    if configs.providers.len() <= 1 {
        return Err("At least one provider is required".to_string());
    }

    configs.providers.retain(|p| p.id != id);

    // 如果删除的是当前provider，切换到第一个
    if configs.current_provider == id {
        configs.current_provider = configs
            .providers
            .first()
            .map(|p| p.id.clone())
            .unwrap_or_default();
    }

    save_configs(&configs)
}

#[tauri::command]
pub fn set_current_provider(id: String) -> Result<(), String> {
    let mut configs = load_configs()?;

    configs
        .providers
        .iter()
        .find(|p| p.id == id)
        .ok_or("Provider not found")?;

    configs.current_provider = id;
    save_configs(&configs)
}
