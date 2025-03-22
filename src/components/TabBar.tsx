import React from 'react';
import styled from 'styled-components';
import { useTabs } from '../contexts/TabsContext';

const TabBar: React.FC = () => {
  const { tabs, activeTabId, addTab, closeTab, activateTab } = useTabs();

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
  background-color: #e8eaed;
  border-bottom: 1px solid #dadce0;
  height: 40px;
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  scrollbar-width: none;
  
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
  background-color: ${props => props.active ? '#fff' : '#e8eaed'};
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
    background-color: ${props => props.active ? '#fff' : '#f1f3f4'};
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background-color: ${props => props.active ? '#1a73e8' : 'transparent'};
  }
`;

const TabTitle = styled.div`
  flex-grow: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
  color: #202124;
  margin-right: 8px;
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
  color: #5f6368;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #dadce0;
    color: #202124;
  }
`;

const AddTabButton = styled.div`
  width: 28px;
  height: 28px;
  min-width: 28px;
  border-radius: 50%;
  background-color: #e8eaed;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  line-height: 1;
  color: #5f6368;
  cursor: pointer;
  margin: 0 8px;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #dadce0;
  }
`;

export default TabBar;