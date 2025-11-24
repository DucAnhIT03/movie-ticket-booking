import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './App.css'
import AppRouter from './routes/index.jsx';
import ErrorBoundary from './shared/ErrorBoundary.jsx';

function App() {
  return (
    <ErrorBoundary>
      <AppRouter />
    </ErrorBoundary>
  )
}

export default App
