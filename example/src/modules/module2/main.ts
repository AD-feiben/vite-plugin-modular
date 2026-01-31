// Module 2 入口文件
import './style.css';

const app = document.querySelector<HTMLDivElement>('#app')!;

// 显示模块信息
app.innerHTML = `
  <div class="container">
    <h1>Module 2</h1>
    <p>这是 Module 2 的入口文件</p>
    <h2>环境变量示例</h2>
    <ul>
      <li><strong>模块名称:</strong> ${import.meta.env.VITE_MODULE_NAME}</li>
      <li><strong>API URL:</strong> ${import.meta.env.VITE_API_URL}</li>
      <li><strong>调试模式:</strong> ${import.meta.env.VITE_DEBUG_MODE}</li>
      <li><strong>最大条目数:</strong> ${import.meta.env.VITE_MAX_ITEMS}</li>
      <li><strong>应用名称:</strong> ${import.meta.env.VITE_APP_INFO_NAME}</li>
      <li><strong>应用版本:</strong> ${import.meta.env.VITE_APP_INFO_VERSION}</li>
    </ul>
    <div class="buttons">
      <button onclick="window.location.href='/?module=module1'">切换到 Module 1</button>
    </div>
  </div>
`;