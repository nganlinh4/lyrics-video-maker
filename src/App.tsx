import React from 'react';
import styled from 'styled-components';
import { QueueProvider } from './contexts/QueueContext';
import { TabsProvider, useTabs } from './contexts/TabsContext';
import { useTheme } from './contexts/ThemeContext';
import { useLanguage } from './contexts/LanguageContext';
import TabBar from './components/TabBar';
import Workspace from './components/Workspace';
import QueueManager from './components/QueueManager';
import ThemeLanguageSwitcher from './components/ThemeLanguageSwitcher';
import { WorkspaceTab } from './contexts/TabsContext';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--background);
  min-height: 100vh;
  font-family: 'Roboto', sans-serif;
  width: 100%;
  transition: background 0.3s;
`;

const Content = styled.div`
  width: 100%;
  max-width: 1200px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Header = styled.header`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 2rem;
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    padding: 0.5rem 1rem;
  }
`;

const Title = styled.h1`
  color: var(--text-color);
  margin: 20px 0;
  font-size: 2.5rem;
  text-align: center;
  transition: color 0.3s;
`;

const WorkspaceContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const QueueContainer = styled.div`
  width: 100%;
  max-width: 800px;
  margin-top: 20px;
`;

// Inner component that uses context hooks
const AppContent: React.FC = () => {
  const { tabs } = useTabs();
  const { t } = useLanguage();
  
  return (
    <Container>
      <Header>
        <Title>{t('appTitle')}</Title>
        <ThemeLanguageSwitcher />
      </Header>
      
      <Content>
        <TabBar />
        
        <WorkspaceContainer>
          {tabs.map((tab: WorkspaceTab) => (
            <Workspace key={tab.id} tabId={tab.id} />
          ))}
        </WorkspaceContainer>
        
        <QueueContainer>
          <QueueManager />
        </QueueContainer>
      </Content>
    </Container>
  );
};

// Outer component that provides contexts
const App: React.FC = () => {
  return (
    <TabsProvider>
      <QueueProvider>
        <AppContent />
      </QueueProvider>
    </TabsProvider>
  );
};

export default App;
