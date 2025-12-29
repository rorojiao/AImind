use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AIConfig {
    pub providers: Vec<AIProvider>,
    pub current_provider: String,
}

impl Default for AIConfig {
    fn default() -> Self {
        Self {
            providers: vec![AIProvider {
                id: "openai-default".to_string(),
                name: "OpenAI".to_string(),
                r#type: "openai".to_string(),
                api_key: String::new(),
                base_url: "https://api.openai.com/v1".to_string(),
                model: "gpt-4o-mini".to_string(),
                temperature: Some(0.7),
                max_tokens: Some(2000),
                enabled: true,
            }],
            current_provider: "openai-default".to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AIProvider {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub r#type: String,
    pub api_key: String,
    pub base_url: String,
    pub model: String,
    pub temperature: Option<f64>,
    pub max_tokens: Option<u64>,
    pub enabled: bool,
}
