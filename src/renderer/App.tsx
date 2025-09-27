import React from 'react';
import Layout from './components/Layout';
import styles from './App.module.scss';

const App: React.FC = () => {
  return (
    <Layout>
      <header className={styles.appHeader}>
        <div className={styles.appHeaderControls}>
          <h1>InSpace Desktop</h1>
        </div>
        <p>Welcome to your Electron + React + TypeScript + SCSS application!</p>
      </header>
      
      <main className={styles.appMain}>
        <div className={styles.featureCard}>
          <h2>🚀 Features</h2>
          <ul>
            <li>✅ Electron.js for desktop app</li>
            <li>✅ React with TypeScript</li>
            <li>✅ SCSS for styling</li>
            <li>✅ ESLint for code quality</li>
            <li>✅ Husky for git hooks</li>
            <li>✅ Collapsible sidebar with smooth animations</li>
            <li>✅ Modern AI-inspired interface</li>
            <li>✅ CSS Modules with Vite</li>
          </ul>
        </div>
      </main>
    </Layout>
  );
};

export default App;