import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// 初始化全局网络搜索功能
// 使用免费的 DuckDuckGo 搜索（无需 API key）
// 如需使用其他搜索源，可在 AI 设置中配置
import { initGlobalWebSearch } from './lib/search/webSearchService'

// 初始化全局搜索（使用默认的 DuckDuckGo）
initGlobalWebSearch({
  type: 'duckduckgo',
  name: 'DuckDuckGo',
  enabled: true,
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
