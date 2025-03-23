import React from 'react';
import styled from 'styled-components';
import { useTabs } from '../contexts/TabsContext';
import { useLanguage } from '../contexts/LanguageContext';

const TabBar: React.FC = () => {
  const { tabs, activeTabId, addTab, closeTab, activateTab } = useTabs();
  const { t } = useLanguage();

  return (
    <TabBarContainer>
      <TabsWrapper>
        {tabs.map(tab => (
          <TabItem 
            key={tab.id} 
            active={tab.id === activeTabId}
            onClick={() => activateTab(tab.id)}
          >
            <TabTitle>{tab.name}</TabTitle>
            <CloseButton onClick={(e) => {
              e.stopPropagation();
              closeTab(tab.id);
            }}>
              &times;
            </CloseButton>
          </TabItem>
        ))}
      </TabsWrapper>
      <AddTabButton onClick={() => addTab()}>+</AddTabButton>
    </TabBarContainer>
  );
};

const TabBarContainer = styled.div`
  display: flex;
  align-items: center;
  background-color: var(--tab-background);
  border-bottom: 1px solid var(--border-color);
  height: 40px;
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  scrollbar-width: none;
  transition: background-color 0.3s;
  
  &::-webkit-scrollbar {
    display: none;
  }
`;

const TabsWrapper = styled.div`
  display: flex;
  flex-grow: 1;
  overflow-x: auto;
  scrollbar-width: none;
  
  &::-webkit-scrollbar {
    display: none;
  }
`;

const TabItem = styled.div<{ active: boolean }>`
  display: flex;
  align-items: center;
  min-width: 160px;
  max-width: 240px;
  height: 38px;
  padding: 0 15px;
  background-color: ${props => props.active ? 'var(--active-tab)' : 'var(--tab-background)'};
  border-radius: 8px 8px 0 0;
  margin-right: 1px;
  margin-left: 1px;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  position: relative;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: ${props => props.active ? 'var(--active-tab)' : 'var(--hover-color)'};
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background-color: ${props => props.active ? 'var(--accent-color)' : 'transparent'};
  }
`;

const TabTitle = styled.div`
  flex-grow: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
  color: var(--text-color);
  margin-right: 8px;
  transition: color 0.3s;
`;

const CloseButton = styled.div`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  line-height: 1;
  color: var(--text-color);
  opacity: 0.7;
  cursor: pointer;
  transition: background-color 0.2s, color 0.3s;
  
  &:hover {
    background-color: var(--hover-color);
    color: var(--text-color);
  }
`;

const AddTabButton = styled.div`
  width: 28px;
  height: 28px;
  min-width: 28px;
  border-radius: 50%;
  background-color: var(--hover-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  line-height: 1;
  color: var(--text-color);
  cursor: pointer;
  margin: 0 8px;
  transition: background-color 0.2s, color 0.3s;
  
  &:hover {
    background-color: var(--border-color);
  }
`;

export default TabBar;