import styled from 'styled-components';

export const Input = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 1rem;
  margin-bottom: 1rem;
  background-color: var(--input-background);
  color: var(--text-color);
  transition: border-color 0.3s, color 0.3s, background-color 0.3s;
  
  &:focus {
    outline: none;
    border-color: var(--accent-color);
    box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.1);
  }
`;

export const Select = styled.select`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 1rem;
  margin-bottom: 1rem;
  background-color: var(--input-background);
  color: var(--text-color);
  cursor: pointer;
  transition: border-color 0.3s, color 0.3s, background-color 0.3s;
  
  &:focus {
    outline: none;
    border-color: var(--accent-color);
    box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.1);
  }
`;

export const InputLabel = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text-color);
  font-weight: 500;
  transition: color 0.3s;
`;