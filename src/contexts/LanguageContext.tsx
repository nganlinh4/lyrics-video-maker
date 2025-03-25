import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

// Define language types
export type Language = 'en' | 'ko';

// Define translations interface
export interface Translations {
  [key: string]: {
    en: string;
    ko: string;
  };
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

// Create translations object
export const translations: Translations = {
  // Common
  appTitle: {
    en: 'Lyrics Video Maker',
    ko: '가사 비디오 메이커'
  },
  theme: {
    en: 'Theme',
    ko: '테마'
  },
  language: {
    en: 'Language',
    ko: '언어'
  },
  light: {
    en: 'Light',
    ko: '라이트'
  },
  dark: {
    en: 'Dark',
    ko: '다크'
  },
  english: {
    en: 'English',
    ko: '영어'
  },
  korean: {
    en: 'Korean',
    ko: '한국어'
  },
  
  // Add the missing translation keys
  note: {
    en: 'Note',
    ko: '참고'
  },
  videosRenderedNote: {
    en: 'Videos will be rendered in the order they are added to the queue. You can continue working while rendering happens in the background.',
    ko: '비디오는 대기열에 추가된 순서대로 렌더링됩니다. 렌더링이 백그라운드에서 진행되는 동안 계속 작업할 수 있습니다.'
  },
  
  // Upload Form
  uploadFiles: {
    en: 'Upload Files',
    ko: '파일 업로드'
  },
  dragAndDropAudio: {
    en: 'Drag and drop an audio file here or click to browse',
    ko: '오디오 파일을 여기에 드래그하거나 클릭하여 찾아보기'
  },
  dragAndDropJson: {
    en: 'Drag and drop a JSON file here or click to browse',
    ko: 'JSON 파일을 여기에 드래그하거나 클릭하여 찾아보기'
  },
  dragAndDropImage: {
    en: 'Drag and drop an image file here or click to browse',
    ko: '이미지 파일을 여기에 드래그하거나 클릭하여 찾아보기'
  },
  quickUpload: {
    en: 'Quick Upload',
    ko: '빠른 업로드'
  },
  quickUploadDescription: {
    en: 'Drop all your files at once! The system will automatically detect:',
    ko: '모든 파일을 한 번에 드롭하세요! 시스템이 자동으로 감지합니다:'
  },
  dropAllFiles: {
    en: 'Drop All Files Here',
    ko: '여기에 모든 파일 드롭'
  },
  dragAndDropAll: {
    en: 'Drag and drop all your files at once for automatic categorization',
    ko: '자동 분류를 위해 모든 파일을 한 번에 드래그 앤 드롭하세요'
  },
  detectedFiles: {
    en: 'Detected Files:',
    ko: '감지된 파일:'
  },
  requiredFiles: {
    en: "Note: You'll need the following files:",
    ko: '참고: 다음 파일들이 필요합니다:'
  },
  mainAudio: {
    en: 'Main Audio: ',
    ko: '메인 오디오: '
  },
  instrumental: {
    en: 'Instrumental: ',
    ko: '반주: '
  },
  vocals: {
    en: 'Vocals: ',
    ko: '보컬: '
  },
  littleVocal: {
    en: 'Little Vocal: ',
    ko: '작은 보컬: '
  },
  lyrics: {
    en: 'Lyrics: ',
    ko: '가사: '
  },
  albumArt: {
    en: 'Album Art: ',
    ko: '앨범 아트: '
  },
  background: {
    en: 'Background: ',
    ko: '배경: '
  },
  artistName: {
    en: 'Artist Name',
    ko: '아티스트 이름'
  },
  songTitle: {
    en: 'Song Title',
    ko: '노래 제목'
  },
  videoType: {
    en: 'Video Type',
    ko: '비디오 타입'
  },
  lyricsVideo: {
    en: 'Lyrics Video',
    ko: '가사 비디오'
  },
  vocalOnly: {
    en: 'Vocal Only',
    ko: '보컬만'
  },
  instrumentalOnly: {
    en: 'Instrumental Only',
    ko: '반주만'
  },
  littleVocalVideo: {
    en: 'Little Vocal',
    ko: '작은 보컬'
  },
  // Add the missing keys that caused the errors
  lyricsvideo: {
    en: 'Lyrics Video',
    ko: '가사 비디오'
  },
  vocalonly: {
    en: 'Vocal Only',
    ko: '보컬만'
  },
  instrumentalonly: {
    en: 'Instrumental Only',
    ko: '반주만'
  },
  littlevocal: {
    en: 'Little Vocal',
    ko: '작은 보컬'
  },
  mainAudioFile: {
    en: 'Main Audio File (MP3, WAV)',
    ko: '메인 오디오 파일 (MP3, WAV)'
  },
  instrumentalAudio: {
    en: 'Instrumental Audio (Optional)',
    ko: '반주 오디오 (선택사항)'
  },
  vocalAudio: {
    en: 'Vocal Audio (Optional)',
    ko: '보컬 오디오 (선택사항)'
  },
  littleVocalAudio: {
    en: 'Little Vocal Audio (Optional)',
    ko: '작은 보컬 오디오 (선택사항)'
  },
  lyricsFile: {
    en: 'Lyrics File (JSON)',
    ko: '가사 파일 (JSON)'
  },
  albumArtOptional: {
    en: 'Album Art (Optional)',
    ko: '앨범 아트 (선택사항)'
  },
  backgroundImages: {
    en: 'Background Images (Optional)',
    ko: '배경 이미지 (선택사항)'
  },
  backgroundNote: {
    en: 'Note: You can upload a different background image for each video type.',
    ko: '참고: 각 비디오 타입별로 다른 배경 이미지를 업로드할 수 있습니다.'
  },
  backgroundForType: {
    en: 'Background for',
    ko: '배경 이미지 -'
  },
  reset: {
    en: 'Reset',
    ko: '초기화'
  },
  audioFilesByNames: {
    en: 'Audio files based on names (containing "music", "vocals", "+")',
    ko: '이름 기반 오디오 파일("music", "vocals", "+" 포함)'
  },
  jsonForLyrics: {
    en: 'JSON files for lyrics',
    ko: '가사용 JSON 파일'
  },
  squareImages: {
    en: 'Square images for album art',
    ko: '앨범 아트용 정사각형 이미지'
  },
  nonSquareImages: {
    en: 'Non-square images for background',
    ko: '배경용 직사각형 이미지'
  },
  
  // Render Control
  addToQueue: {
    en: 'Add Version to Queue',
    ko: '버전을 대기열에 추가'
  },
  addAllVersions: {
    en: 'Add All Versions to Queue',
    ko: '모든 버전을 대기열에 추가'
  },
  complete: {
    en: 'Complete',
    ko: '완료'
  },
  
  // Queue Manager
  renderQueue: {
    en: 'Render Queue',
    ko: '렌더링 대기열'
  },
  clearQueue: {
    en: 'Clear Queue',
    ko: '대기열 지우기'
  },
  pending: {
    en: 'Pending',
    ko: '대기 중'
  },
  processing: {
    en: 'Processing',
    ko: '처리 중'
  },
  completed: {
    en: 'Completed',
    ko: '완료됨'
  },
  failed: {
    en: 'Failed',
    ko: '실패'
  },
  remove: {
    en: 'Remove',
    ko: '제거'
  },
  
  // Preview
  videoPreview: {
    en: 'Video Preview',
    ko: '비디오 미리보기'
  },
  finalVideo: {
    en: 'Final Video',
    ko: '최종 비디오'
  },
  noVideo: {
    en: 'No video pending to render.',
    ko: '렌더링 대기 중인 비디오가 없습니다.'
  },
  // VideoPreview translations
  videoDetails: {
    en: 'Video Details',
    ko: '비디오 세부정보'
  },
  files: {
    en: 'Files',
    ko: '파일'
  },
  previewDesc: {
    en: 'Preview will appear here after rendering',
    ko: '렌더링 후 미리보기가 여기에 표시됩니다'
  },
  uploadAudioFirst: {
    en: 'Please upload an audio file first',
    ko: '오디오 파일을 먼저 업로드하세요'
  },
  enterArtistAndTitle: {
    en: 'Please enter artist name and song title',
    ko: '아티스트 이름과 노래 제목을 입력하세요'
  },
  
  // Workspace
  metadataPosition: {
    en: 'Metadata Position',
    ko: '메타데이터 위치'
  },
  metadataWidth: {
    en: 'Metadata Width',
    ko: '메타데이터 너비'
  },
  lyricsLineThreshold: {
    en: 'Lyrics Line Threshold',
    ko: '가사 줄 임계값'
  },
  adjustPreview: {
    en: 'Adjust Preview',
    ko: '미리보기 조정'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize language from localStorage or default to 'en'
  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as Language) || 'en';
  });

  // Update localStorage when language changes
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  // Translation function
  const t = (key: string): string => {
    if (!translations[key]) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
    return translations[key][language];
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};