import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Provider } from "react-redux"
import store from './redux/store.js'

// Test xem có render được không
try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('Root element not found!');
  } else {
    createRoot(rootElement).render(
      <StrictMode>
        <Provider store={store}>
          <App />
        </Provider>
      </StrictMode>,
    );
  }
} catch (error) {
  console.error('Error rendering app:', error);
  document.body.innerHTML = `
    <div style="padding: 20px; background: #ff0000; color: #fff; min-height: 100vh;">
      <h1>Lỗi khi render React!</h1>
      <pre>${error.toString()}</pre>
      <pre>${error.stack}</pre>
    </div>
  `;
}
