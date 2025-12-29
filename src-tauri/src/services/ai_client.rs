use crate::models::config::AIProvider;
use reqwest::Client;
use serde_json::json;

pub struct AIClient {
    client: Client,
    provider: AIProvider,
}

impl AIClient {
    pub fn new(provider: &AIProvider) -> Result<Self, String> {
        Ok(Self {
            client: Client::new(),
            provider: provider.clone(),
        })
    }

    pub async fn chat(&self, prompt: &str, _system: Option<&str>) -> Result<String, String> {
        let url = format!("{}/chat/completions", self.provider.base_url);

        let body = json!({
            "model": self.provider.model,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": self.provider.temperature.unwrap_or(0.7),
            "max_tokens": self.provider.max_tokens.unwrap_or(2000),
        });

        let mut request = self.client.post(&url);

        // 添加认证头
        if let Some(api_key) = &self.provider.api_key {
            request = request.header("Authorization", format!("Bearer {}", api_key));
        }

        // Anthropic使用不同的头
        if self.provider.r#type == "anthropic" {
            request = request
                .header("x-api-key", api_key.unwrap_or(""))
                .header("anthropic-version", "2023-06-01");
        }

        let response = request
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response
                .text()
                .await
                .unwrap_or_else(|_| "Unknown error".to_string());
            return Err(format!("API error ({}): {}", status, error_text));
        }

        let json: serde_json::Value = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse response: {}", e))?;

        // 解析响应
        if self.provider.r#type == "anthropic" {
            if let Some(content) = json["content"][0]["text"].as_str() {
                return Ok(content.to_string());
            }
        } else {
            if let Some(content) = json["choices"][0]["message"]["content"].as_str() {
                return Ok(content.to_string());
            }
        }

        Err("Empty response".to_string())
    }
}
