import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import styled, { ThemeProvider, createGlobalStyle } from 'styled-components';
import UploadForm from './components/UploadForm';
import QueueManager from './components/QueueManager';
import { LyricEntry } from './types';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { ThemeProvider as CustomThemeProvider, useTheme, ThemeConsumer, lightTheme, darkTheme } from './contexts/ThemeContext';
import { QueueProvider } from './contexts/QueueContext';
import { TabsProvider, useTabs } from './contexts/TabsContext';
import TabBar from './components/TabBar';
import Workspace from './components/Workspace';
import ThemeLanguageSwitcher from './components/ThemeLanguageSwitcher';
import { v4 as uuidv4 } from 'uuid';

// Create our Header component
const Header: React.FC = () => {
  return (
    <HeaderContainer>
      <Logo>
        <MusicIcon />
        <h1>{useLanguage().t('appTitle')}</h1>
      </Logo>
      <Controls>
        <ThemeLanguageSwitcher />
      </Controls>
    </HeaderContainer>
  );
};

// Icon components
const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"></circle>
    <line x1="12" y1="1" x2="12" y2="3"></line>
    <line x1="12" y1="21" x2="12" y2="23"></line>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
    <line x1="1" y1="12" x2="3" y2="12"></line>
    <line x1="21" y1="12" x2="23" y2="12"></line>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
  </svg>
);

const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
  </svg>
);

const MusicIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18V5l12-2v13"></path>
    <circle cx="6" cy="18" r="3"></circle>
    <circle cx="18" cy="16" r="3"></circle>
  </svg>
);

const HeaderContainer = styled.header`
  background: linear-gradient(135deg, var(--header-gradient-start), var(--header-gradient-end));
  color: var(--header-text);
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
  transition: all 0.3s ease;
  
  @media (max-width: 768px) {
    padding: 1rem;
    flex-direction: column;
    align-items: flex-start;
  }
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  
  h1 {
    font-size: 1.5rem;
    margin: 0;
    font-weight: 600;
    letter-spacing: 0.5px;
    color: var(--header-text);
    
    @media (max-width: 768px) {
      font-size: 1.3rem;
    }
  }
  
  svg {
    margin-right: 0.75rem;
    font-size: 1.75rem;
  }
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  
  @media (max-width: 768px) {
    margin-top: 1rem;
    width: 100%;
    justify-content: flex-end;
  }
`;

const ControlButton = styled.button`
  background: transparent;
  border: none;
  color: var(--header-text);
  padding: 0.5rem;
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 0.9rem;
  border-radius: 4px;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  
  svg {
    margin-right: 0.5rem;
    font-size: 1.25rem;
  }
`;

const Select = styled.select`
  background: rgba(255, 255, 255, 0.1);
  color: var(--header-text);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.15);
  }
  
  option {
    background: var(--dropdown-background);
    color: var(--text-color);
  }
`;

const GlobalStyle = createGlobalStyle`
  :root {
    --accent-color: #3f51b5;
    --accent-color-secondary: #7986cb;
    --accent-color-rgb: 63, 81, 181;
    --border-color: rgba(0, 0, 0, 0.1);
    --hover-color: rgba(0, 0, 0, 0.03);
    --hover-color-darker: rgba(0, 0, 0, 0.08);
    --disabled-color: #cccccc;
    --info-background: rgba(25, 118, 210, 0.05);
    --error-color: #f44336;
    --error-background: rgba(244, 67, 54, 0.08);
    --code-background: #2d2d2d;
    --code-text-color: #f8f8f2;
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    padding: 0;
    font-family: 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: var(--background-color);
    color: var(--text-color);
    transition: all 0.3s ease;
  }

  h1, h2, h3, h4, h5, h6 {
    margin-top: 0;
    color: var(--heading-color);
  }

  a {
    color: var(--accent-color);
    text-decoration: none;
    transition: color 0.2s ease;
    
    &:hover {
      color: var(--accent-color-secondary);
    }
  }

  button, input, select, textarea {
    font-family: inherit;
  }

  /* Scrollbar styling */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  ::-webkit-scrollbar-track {
    background: var(--scrollbar-track);
  }
  
  ::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb);
    border-radius: 4px;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: var(--scrollbar-thumb-hover);
  }
`;

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--background-color);
  color: var(--text-color);
  transition: background-color 0.3s ease;
`;

const MainContent = styled.main`
  flex: 1;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const ContentContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  
  @media (min-width: 1024px) {
    grid-template-columns: 3fr 2fr;
  }
`;

const SectionCard = styled.section`
  background: var(--card-background);
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.07);
  overflow: hidden;
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);
    transform: translateY(-2px);
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  margin: 0;
  padding: 1.25rem;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--section-header-bg);
  color: var(--heading-color);
`;

const SectionContent = styled.div`
  padding: 1.5rem;
`;

const Footer = styled.footer`
  text-align: center;
  padding: 1.5rem;
  margin-top: 2rem;
  background-color: var(--footer-background);
  color: var(--footer-text);
  border-top: 1px solid var(--border-color);
  
  p {
    margin: 0.5rem 0;
    font-size: 0.9rem;
  }
`;

// Type definitions for initial values and queue item
interface AudioFiles {
  main: File | null;
  instrumental: File | null;
  vocal: File | null;
  littleVocal: File | null;
}

interface VideoMetadata {
  artist: string;
  songTitle: string;
  videoType: 'Lyrics Video' | 'Vocal Only' | 'Instrumental Only' | 'Little Vocal';
  lyricsLineThreshold: number;
  metadataPosition: number;
  metadataWidth: number;
}

interface FormInitialValues {
  audioFiles: AudioFiles;
  lyrics: LyricEntry[] | null;
  albumArtFile: File | null;
  backgroundFiles: { [key: string]: File | null };
  metadata: VideoMetadata;
}

export type QueueItemStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface QueueItemData {
  id: string;
  status: QueueItemStatus;
  progress: number;
  artist: string;
  songTitle: string;
  videoType: string;
  outputPath?: string;
  errorMessage?: string;
}

// App content component with tabs
const AppContent: React.FC = () => {
  const { t } = useLanguage();
  const { activeWorkspace } = useTabs();
  
  return (
    <PageContainer>
      <Header />
      <TabBar />
      <MainContent>
        {activeWorkspace && (
          <Workspace tabId={activeWorkspace.id} />
        )}
        <QueueSection>
          <SectionCard>
            <SectionTitle>{t('renderQueue')}</SectionTitle>
            <SectionContent>
              <QueueManager />
            </SectionContent>
          </SectionCard>
        </QueueSection>
      </MainContent>
      <Footer>
        <p>© {new Date().getFullYear()} Lyrics Video Maker</p>
        <p>Version 1.0.0</p>
      </Footer>
    </PageContainer>
  );
};

// Main App component
function App() {
  return (
    <Router>
      <CustomThemeProvider>
        <ThemeConsumer>
          {(themeContext) => themeContext && (
            <ThemeProvider theme={themeContext.theme === 'dark' ? darkTheme : lightTheme}>
              <LanguageProvider>
                <QueueProvider>
                  <TabsProvider>
                    <GlobalStyle />
                    <Routes>
                      <Route path="/" element={<AppContent />} />
                    </Routes>
                  </TabsProvider>
                </QueueProvider>
              </LanguageProvider>
            </ThemeProvider>
          )}
        </ThemeConsumer>
      </CustomThemeProvider>
    </Router>
  );
}

// Adding QueueSection styling
const QueueSection = styled.div`
  margin-top: 2rem;
  width: 100%;
`;

export default App;
