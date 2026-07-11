import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App.jsx'
import Layout from './components/Layout.jsx'
import ChatArea from './components/ChatArea.jsx'
import Home from './components/Home.jsx'
import SharedView from './components/SharedView.jsx'

const router = createBrowserRouter([
  { 
    path: '/', 
    element: <Layout />,
    children: [
      { index: true, element: <ChatArea /> },
      { path: 'chat', element: <Home __forceChatMode /> },
      { path: 'share/:shareId', element: <SharedView /> }
    ]
  }
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)