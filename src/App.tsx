import React from 'react';
import styled from 'styled-components';
import { QueueProvider } from './contexts/QueueContext';
import { TabsProvider, useTabs } from './contexts/TabsContext';
import TabBar from './components/TabBar';
import Workspace from './components/Workspace';
import QueueManager from './components/QueueManager';
import { WorkspaceTab } from './contexts/TabsContext';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
  font-family: 'Roboto', sans-serif;
  width: 100%;
`;

const Content = styled.div`
  width: 100%;
  max-width: 1200px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Title = styled.h1`
  color: #333;
  margin: 20px 0;
  font-size: 2.5rem;
  text-align: center;
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

const AppContent: React.FC = () => {
  const { tabs } = useTabs();
  
  return (
    <Container>
      <Title>Lyrics Video Maker</Title>
      
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
