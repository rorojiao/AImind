use crate::services::ai_client::AIClient;
use serde_json::Value;
use std::collections::HashMap;

#[tauri::command]
pub async fn ai_chat(prompt: String, provider_id: String) -> Result<String, String> {
    let config = crate::commands::config::load_configs()?;
    let provider = config
        .providers
        .iter()
        .find(|p| p.id == provider_id)
        .ok_or("AI provider not found")?;

    let client = AIClient::new(provider)?;
    client.chat(&prompt, None).await
}

#[tauri::command]
pub async fn ai_expand_node(node_content: String, provider_id: String) -> Result<Vec<String>, String> {
    let prompt = format!(
        "你是一个思维导图助手。用户选中了节点\"{}\"，
请生成4-6个有价值的子节点，帮助扩展这个主题。
要求：
1. 简洁明了，每个子节点不超过10个字
2. 逻辑清晰，覆盖主要方面
3. 用JSON数组格式返回，例如：[\"子节点1\", \"子节点2\", ...]",
        node_content
    );

    let config = crate::commands::config::load_configs()?;
    let provider = config
        .providers
        .iter()
        .find(|p| p.id == provider_id)
        .ok_or("AI provider not found")?;

    let client = AIClient::new(provider)?;
    let response = client.chat(&prompt, None).await?;

    // 尝试解析JSON
    if let Ok(json) = serde_json::from_str::<Value>(&response) {
        if let Some(arr) = json.as_array() {
            let nodes: Vec<String> = arr
                .iter()
                .filter_map(|v| v.as_str().map(|s| s.to_string()))
                .collect();
            if !nodes.is_empty() {
                return Ok(nodes);
            }
        }
    }

    // 如果JSON解析失败，按行分割
    Ok(response
        .lines()
        .map(|l| l.trim().to_string())
        .filter(|l| !l.is_empty())
        .collect())
}

#[tauri::command]
pub async fn ai_analyze_mindmap(
    _data: Value,
    _provider_id: String,
) -> Result<HashMap<String, Value>, String> {
    // TODO: 实现思维导图分析
    let mut result = HashMap::new();
    result.insert("completeness".to_string(), Value::Number(serde_json::Number::from(50)));
    result.insert("suggestions".to_string(), Value::Array(vec![]));
    Ok(result)
}
