import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './App.css'
import AppRouter from './routes/index.jsx';
import ErrorBoundary from './shared/ErrorBoundary.jsx';
import ChatWidget from './components/ChatWidget.jsx';
import AccountBlockListener from './components/AccountBlockListener.jsx';

function App() {
  return (
    <ErrorBoundary>
      <AccountBlockListener />
      <AppRouter />
      <ChatWidget />
    </ErrorBoundary>
  )
}

export default App
