import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'

const router = createMemoryRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/401',
    element: <div>Hello world!</div>,
  }
])



ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)

// Use contextBridge
window.ipcRenderer.on('main-process-message', (_event, message) => {
  console.log('渲染进程收到来自主进程的消息:', message)
})

// 向主进程发送消息
window.ipcRenderer.send('renderer-process-message', encodeURIComponent('你好，主进程！1111'))


// 渲染进程向主进程发送消息并异步等待结果
window.ipcRenderer.invoke('renderer-process-message', encodeURIComponent('你好，主进程！2222')).then((result) => {
  console.log('渲染进程收到来自主进程的消息:', decodeURIComponent(result))
})



window.addEventListener("DOMContentLoaded", () => {
  console.log("process1222------------------", process);
});
