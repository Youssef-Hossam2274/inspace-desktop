import React from 'react';
import Layout from './components/Layout';

const App: React.FC = () => {
  return (
    <Layout>
      <header className="app-header">
        <div className="app-header__controls">
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
            <li>✅ CSS Modules for scoped styling</li>
          </ul>
        </div>
      </main>
    </Layout>
  );
};

export default App;