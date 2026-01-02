import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// 初始化全局网络搜索功能
// 使用智谱AI Web Search API（真实网络搜索）
import { initGlobalWebSearch } from './lib/search/webSearchService'

// 初始化全局搜索（使用智谱AI + 你的 API key）
initGlobalWebSearch({
  type: 'zhipu',
  name: '智谱AI',
  enabled: true,
  apiKey: '8611232f6f8e42f19d29eb454f14b20f.8L7DTW3fIsLoivJF',
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
