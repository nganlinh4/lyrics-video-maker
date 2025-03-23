import React from 'react';
import styled from 'styled-components';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage, Language } from '../contexts/LanguageContext';

const ThemeLanguageSwitcher: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const isDark = theme === 'dark';

  return (
    <SwitcherContainer>
      <SwitcherGroup>
        <SwitcherLabel>{t('theme')}:</SwitcherLabel>
        <ThemeToggle onClick={toggleTheme} $isDark={isDark}>
          <ToggleThumb $isDark={isDark} />
          <ToggleIconLight>☀️</ToggleIconLight>
          <ToggleIconDark>🌙</ToggleIconDark>
        </ThemeToggle>
      </SwitcherGroup>

      <SwitcherGroup>
        <SwitcherLabel>{t('language')}:</SwitcherLabel>
        <LanguageSelect 
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
        >
          <option value="en">{t('english')}</option>
          <option value="ko">{t('korean')}</option>
        </LanguageSelect>
      </SwitcherGroup>
    </SwitcherContainer>
  );
};

const SwitcherContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin: 0 1rem;
`;

const SwitcherGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SwitcherLabel = styled.span`
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-color);
`;

const ThemeToggle = styled.button<{ $isDark: boolean }>`
  position: relative;
  width: 60px;
  height: 30px;
  border-radius: 15px;
  background-color: ${props => props.$isDark ? '#384259' : '#cce4ff'};
  border: none;
  cursor: pointer;
  padding: 0;
  transition: background-color 0.3s;
  overflow: hidden;
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.4);
  }
`;

const ToggleThumb = styled.div<{ $isDark: boolean }>`
  position: absolute;
  top: 3px;
  left: ${props => props.$isDark ? '33px' : '3px'};
  width: 24px;
  height: 24px;
  background-color: white;
  border-radius: 50%;
  transition: left 0.3s;
  z-index: 2;
`;

const ToggleIconLight = styled.span`
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
`;

const ToggleIconDark = styled.span`
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
`;

const LanguageSelect = styled.select`
  padding: 6px 10px;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  background-color: var(--background-color);
  color: var(--text-color);
  font-size: 0.9rem;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #2196f3;
    box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
  }
`;

export default ThemeLanguageSwitcher;