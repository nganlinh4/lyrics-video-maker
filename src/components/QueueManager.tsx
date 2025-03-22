import React from 'react';
import styled from 'styled-components';
import { useQueue, QueueItem } from '../contexts/QueueContext';
import VideoPreview from './VideoPreview';

const QueueManager: React.FC = () => {
  const { queue, removeFromQueue, clearQueue, isProcessing, currentProcessingItem } = useQueue();

  if (queue.length === 0) {
    return null;
  }

  const pendingItems = queue.filter(item => item.status === 'pending');
  const processingItems = queue.filter(item => item.status === 'processing');
  const completedItems = queue.filter(item => item.status === 'complete');
  const errorItems = queue.filter(item => item.status === 'error');

  return (
    <QueueContainer>
      <QueueHeader>
        <h3>Render Queue</h3>
        <QueueActions>
          <QueueButton 
            onClick={clearQueue}
            disabled={isProcessing}
            title={isProcessing ? "Can't clear queue while rendering" : "Clear all items from queue"}
          >
            Clear Queue
          </QueueButton>
        </QueueActions>
      </QueueHeader>

      <QueueStats>
        <QueueStat>Pending: {pendingItems.length}</QueueStat>
        <QueueStat>Processing: {processingItems.length}</QueueStat>
        <QueueStat>Completed: {completedItems.length}</QueueStat>
        <QueueStat>Failed: {errorItems.length}</QueueStat>
      </QueueStats>

      <QueueList>
        {queue.map(item => (
          <QueueItemContainer key={item.id}>
            <QueueItemHeader>
              <QueueItemTitle>
                {item.metadata.artist} - {item.metadata.songTitle}
              </QueueItemTitle>
              <QueueItemStatus status={item.status}>
                {item.status === 'pending' && 'Pending'}
                {item.status === 'processing' && `Processing (${Math.round(item.progress * 100)}%)`}
                {item.status === 'complete' && 'Complete'}
                {item.status === 'error' && 'Failed'}
              </QueueItemStatus>
            </QueueItemHeader>

            {item.status === 'processing' && (
              <ProgressContainer>
                <ProgressBar width={item.progress * 100} />
              </ProgressContainer>
            )}

            {item.status === 'complete' && item.result && (
              <ResultsContainer>
                {Object.entries(item.result).map(([videoType, url]) => (
                  <ResultItem key={videoType}>
                    <ResultLabel>{videoType}</ResultLabel>
                    <VideoPreview videoUrl={url} />
                  </ResultItem>
                ))}
              </ResultsContainer>
            )}

            {item.status === 'error' && (
              <ErrorMessage>{item.error || 'An unknown error occurred'}</ErrorMessage>
            )}

            <QueueItemActions>
              {item.status !== 'processing' && (
                <QueueButton 
                  onClick={() => removeFromQueue(item.id)} 
                  disabled={isProcessing && currentProcessingItem === item.id}
                >
                  Remove
                </QueueButton>
              )}
            </QueueItemActions>
          </QueueItemContainer>
        ))}
      </QueueList>
    </QueueContainer>
  );
};

const QueueContainer = styled.div`
  margin: 20px 0;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const QueueHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  
  h3 {
    margin: 0;
  }
`;

const QueueActions = styled.div`
  display: flex;
  gap: 10px;
`;

const QueueButton = styled.button`
  background: linear-gradient(135deg, #6e8efb 0%, #a777e3 100%);
  color: white;
  padding: 8px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    transform: translateY(-2px);
  }
`;

const QueueStats = styled.div`
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
  flex-wrap: wrap;
`;

const QueueStat = styled.div`
  padding: 5px 10px;
  background-color: #e9ecef;
  border-radius: 20px;
  font-size: 0.85rem;
  color: #495057;
`;

const QueueList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const QueueItemContainer = styled.div`
  padding: 15px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
`;

const QueueItemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`;

const QueueItemTitle = styled.div`
  font-weight: 600;
  font-size: 1.1rem;
`;

const QueueItemStatus = styled.div<{ status: QueueItem['status'] }>`
  padding: 4px 10px;
  border-radius: 15px;
  font-size: 0.8rem;
  font-weight: 500;
  
  ${({ status }) => {
    if (status === 'pending') return 'background-color: #e9ecef; color: #495057;';
    if (status === 'processing') return 'background-color: #cff4fc; color: #055160;';
    if (status === 'complete') return 'background-color: #d1e7dd; color: #0f5132;';
    if (status === 'error') return 'background-color: #f8d7da; color: #842029;';
    return '';
  }}
`;

const QueueItemActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
`;

const ProgressContainer = styled.div`
  width: 100%;
  height: 15px;
  background-color: #f0f0f0;
  border-radius: 8px;
  margin: 10px 0;
  overflow: hidden;
`;

const ProgressBar = styled.div<{ width: number }>`
  width: ${props => props.width}%;
  height: 100%;
  background: linear-gradient(135deg, #6e8efb 0%, #a777e3 100%);
  transition: width 0.3s ease;
`;

const ResultsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;
`;

const ResultItem = styled.div`
  margin-bottom: 10px;
`;

const ResultLabel = styled.div`
  font-weight: 500;
  margin-bottom: 5px;
  color: #495057;
`;

const ErrorMessage = styled.div`
  margin: 10px 0;
  padding: 10px;
  background-color: #f8d7da;
  border-radius: 4px;
  color: #842029;
  font-size: 0.9rem;
`;

export default QueueManager;