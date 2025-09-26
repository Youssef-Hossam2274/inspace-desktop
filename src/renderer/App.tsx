import React, { useState } from 'react';
import Sidebar from './components/Sidebar';

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  return (
    <div className="app">
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />
      
      <div className={`app-content ${isSidebarOpen ? 'app-content--sidebar-open' : ''}`}>
        <header className="app-header">
          <div className="app-header__controls">
            <button 
              className="app-header__menu-toggle"
              onClick={toggleSidebar}
              aria-label="Toggle sidebar"
            >
              ☰
            </button>
            <h1>InSpace Desktop</h1>
          </div>
          <p>Welcome to your Electron + React + TypeScript + SCSS application!</p>
        </header>
        
        <main className="app-main">
          <div className="feature-card">
            <h2>🚀 Features</h2>
            <ul>
              <li>✅ Electron.js for desktop app</li>
              <li>✅ React with TypeScript</li>
              <li>✅ SCSS for styling</li>
              <li>✅ ESLint for code quality</li>
              <li>✅ Husky for git hooks</li>
              <li>✅ Collapsible sidebar with smooth animations</li>
              <li>✅ Modern AI-inspired interface</li>
            </ul>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;