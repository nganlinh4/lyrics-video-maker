import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

// Define language types
// Added 'vi' for Vietnamese
export type Language = 'en' | 'ko' | 'vi';

// Define translations interface
// Added 'vi' property for Vietnamese translations
export interface Translations {
  [key: string]: {
    en: string;
    ko: string;
    vi: string; // Added Vietnamese
  };
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

// Create translations object
// Added Vietnamese (vi) translations for all keys
export const translations: Translations = {
  // Common
  appTitle: {
    en: 'Lyrics Video Maker',
    ko: '가사 비디오 메이커',
    vi: 'Trình tạo Video Lời bài hát'
  },
  theme: {
    en: 'Theme',
    ko: '테마',
    vi: 'Chủ đề'
  },
  language: {
    en: 'Language',
    ko: '언어',
    vi: 'Ngôn ngữ'
  },
  light: {
    en: 'Light',
    ko: '라이트',
    vi: 'Sáng'
  },
  dark: {
    en: 'Dark',
    ko: '다크',
    vi: 'Tối'
  },
  english: {
    en: 'English',
    ko: '영어',
    vi: 'Tiếng Anh'
  },
  korean: {
    en: 'Korean',
    ko: '한국어',
    vi: 'Tiếng Hàn'
  },
  vietnamese: { // Added key for Vietnamese language option
    en: 'Vietnamese',
    ko: '베트남어',
    vi: 'Tiếng Việt'
  },
  clearCache: {
    en: 'Clear Cache',
    ko: '캐시 지우기',
    vi: 'Xóa bộ nhớ đệm'
  },
  note: {
    en: 'Note',
    ko: '참고',
    vi: 'Lưu ý'
  },
  videosRenderedNote: {
    en: 'Videos will be rendered in the order they are added to the queue. You can continue working while rendering happens in the background.',
    ko: '비디오는 대기열에 추가된 순서대로 렌더링됩니다. 렌더링이 백그라운드에서 진행되는 동안 계속 작업할 수 있습니다.',
    vi: 'Các video sẽ được kết xuất theo thứ tự được thêm vào hàng đợi. Bạn có thể tiếp tục làm việc trong khi quá trình kết xuất diễn ra ở chế độ nền.'
  },

  // Upload Form
  uploadFiles: {
    en: 'Upload Files',
    ko: '파일 업로드',
    vi: 'Tải lên tệp'
  },
  dragAndDropAudio: {
    en: 'Drag and drop an audio file here or click to browse',
    ko: '오디오 파일을 여기에 드래그하거나 클릭하여 찾아보기',
    vi: 'Kéo và thả tệp âm thanh vào đây hoặc nhấp để duyệt'
  },
  dragAndDropJson: {
    en: 'Drag and drop a JSON file here or click to browse',
    ko: 'JSON 파일을 여기에 드래그하거나 클릭하여 찾아보기',
    vi: 'Kéo và thả tệp JSON vào đây hoặc nhấp để duyệt'
  },
  dragAndDropImage: {
    en: 'Drag and drop an image file here or click to browse',
    ko: '이미지 파일을 여기에 드래그하거나 클릭하여 찾아보기',
    vi: 'Kéo và thả tệp hình ảnh vào đây hoặc nhấp để duyệt'
  },
  quickUpload: {
    en: 'Quick Upload',
    ko: '빠른 업로드',
    vi: 'Tải lên nhanh'
  },
  quickUploadDescription: {
    en: 'Drop all your files at once! The system will automatically detect:',
    ko: '모든 파일을 한 번에 드롭하세요! 시스템이 자동으로 감지합니다:',
    vi: 'Thả tất cả các tệp của bạn cùng một lúc! Hệ thống sẽ tự động phát hiện:'
  },
  dropAllFiles: {
    en: 'Drop All Files Here',
    ko: '여기에 모든 파일 드롭',
    vi: 'Thả tất cả tệp vào đây'
  },
  dragAndDropAll: {
    en: 'Drag and drop all your files at once for automatic categorization',
    ko: '자동 분류를 위해 모든 파일을 한 번에 드래그 앤 드롭하세요',
    vi: 'Kéo và thả tất cả các tệp của bạn cùng một lúc để phân loại tự động'
  },
  detectedFiles: {
    en: 'Detected Files:',
    ko: '감지된 파일:',
    vi: 'Các tệp đã phát hiện:'
  },
  requiredFiles: {
    en: "Note: You'll need the following files:",
    ko: '참고: 다음 파일들이 필요합니다:',
    vi: 'Lưu ý: Bạn sẽ cần các tệp sau:'
  },
  mainAudio: {
    en: 'Main Audio: ',
    ko: '메인 오디오: ',
    vi: 'Âm thanh chính: '
  },
  instrumental: {
    en: 'Instrumental: ',
    ko: '반주: ',
    vi: 'Nhạc nền: '
  },
  vocals: {
    en: 'Vocals: ',
    ko: '보컬: ',
    vi: 'Giọng hát: '
  },
  littleVocal: {
    en: 'Little Vocal: ',
    ko: '작은 보컬: ',
    vi: 'Giọng hát nhỏ: '
  },
  lyrics: {
    en: 'Lyrics: ',
    ko: '가사: ',
    vi: 'Lời bài hát: '
  },
  albumArt: {
    en: 'Album Art: ',
    ko: '앨범 아트: ',
    vi: 'Ảnh bìa album: '
  },
  background: {
    en: 'Background: ',
    ko: '배경: ',
    vi: 'Hình nền: '
  },
  artistName: {
    en: 'Artist Name',
    ko: '아티스트 이름',
    vi: 'Tên nghệ sĩ'
  },
  songTitle: {
    en: 'Song Title',
    ko: '노래 제목',
    vi: 'Tên bài hát'
  },
  videoType: {
    en: 'Video Type',
    ko: '비디오 타입',
    vi: 'Loại video'
  },
  lyricsVideo: {
    en: 'Lyrics Video',
    ko: '가사 비디오',
    vi: 'Video lời bài hát'
  },
  vocalOnly: {
    en: 'Vocal Only',
    ko: '보컬만',
    vi: 'Chỉ giọng hát'
  },
  instrumentalOnly: {
    en: 'Instrumental Only',
    ko: '반주만',
    vi: 'Chỉ nhạc nền'
  },
  littleVocalVideo: {
    en: 'Little Vocal',
    ko: '작은 보컬',
    vi: 'Giọng hát nhỏ'
  },
  lyricsvideo: { // Assuming these lowercase keys are intended
    en: 'Lyrics Video',
    ko: '가사 비디오',
    vi: 'Video lời bài hát'
  },
  vocalonly: {
    en: 'Vocal Only',
    ko: '보컬만',
    vi: 'Chỉ giọng hát'
  },
  instrumentalonly: {
    en: 'Instrumental Only',
    ko: '반주만',
    vi: 'Chỉ nhạc nền'
  },
  littlevocal: {
    en: 'Little Vocal',
    ko: '작은 보컬',
    vi: 'Giọng hát nhỏ'
  },
  mainAudioFile: {
    en: 'Main Audio File (MP3, WAV)',
    ko: '메인 오디오 파일 (MP3, WAV)',
    vi: 'Tệp âm thanh chính (MP3, WAV)'
  },
  instrumentalAudio: {
    en: 'Instrumental Audio (Optional)',
    ko: '반주 오디오 (선택사항)',
    vi: 'Âm thanh nhạc nền (Tùy chọn)'
  },
  vocalAudio: {
    en: 'Vocal Audio (Optional)',
    ko: '보컬 오디오 (선택사항)',
    vi: 'Âm thanh giọng hát (Tùy chọn)'
  },
  littleVocalAudio: {
    en: 'Little Vocal Audio (Optional)',
    ko: '작은 보컬 오디오 (선택사항)',
    vi: 'Âm thanh giọng hát nhỏ (Tùy chọn)'
  },
  lyricsFile: {
    en: 'Lyrics File (JSON)',
    ko: '가사 파일 (JSON)',
    vi: 'Tệp lời bài hát (JSON)'
  },
  albumArtOptional: {
    en: 'Album Art (Optional)',
    ko: '앨범 아트 (선택사항)',
    vi: 'Ảnh bìa album (Tùy chọn)'
  },
  backgroundImages: {
    en: 'Background Images (Optional)',
    ko: '배경 이미지 (선택사항)',
    vi: 'Hình nền (Tùy chọn)'
  },
  backgroundNote: {
    en: 'Note: You can upload a different background image for each video type.',
    ko: '참고: 각 비디오 타입별로 다른 배경 이미지를 업로드할 수 있습니다.',
    vi: 'Lưu ý: Bạn có thể tải lên hình nền khác nhau cho mỗi loại video.'
  },
  backgroundForType: {
    en: 'Background for',
    ko: '배경 이미지 -', // Note: Korean uses a dash, English/Vietnamese use 'for'
    vi: 'Hình nền cho'
  },
  reset: {
    en: 'Reset',
    ko: '초기화',
    vi: 'Đặt lại'
  },
  audioFilesByNames: {
    en: 'Audio files based on names (containing "music", "vocals", "+")',
    ko: '이름 기반 오디오 파일("music", "vocals", "+" 포함)',
    vi: 'Tệp âm thanh dựa trên tên (chứa "music", "vocals", "+")'
  },
  jsonForLyrics: {
    en: 'JSON files for lyrics',
    ko: '가사용 JSON 파일',
    vi: 'Tệp JSON cho lời bài hát'
  },
  squareImages: {
    en: 'Square images for album art',
    ko: '앨범 아트용 정사각형 이미지',
    vi: 'Hình ảnh vuông cho ảnh bìa album'
  },
  nonSquareImages: {
    en: 'Non-square images for background',
    ko: '배경용 직사각형 이미지',
    vi: 'Hình ảnh không vuông cho hình nền'
  },

  // Render Control
  addToQueue: {
    en: 'Add Version to Queue',
    ko: '버전을 대기열에 추가',
    vi: 'Thêm phiên bản vào hàng đợi'
  },
  addAllVersions: {
    en: 'Add All Versions to Queue',
    ko: '모든 버전을 대기열에 추가',
    vi: 'Thêm tất cả phiên bản vào hàng đợi'
  },
  complete: {
    en: 'Complete',
    ko: '완료',
    vi: 'Hoàn thành'
  },

  // Queue Manager
  renderQueue: {
    en: 'Render Queue',
    ko: '렌더링 대기열',
    vi: 'Hàng đợi kết xuất'
  },
  clearQueue: {
    en: 'Clear Queue',
    ko: '대기열 지우기',
    vi: 'Xóa hàng đợi'
  },
  pending: {
    en: 'Pending',
    ko: '대기 중',
    vi: 'Đang chờ'
  },
  processing: {
    en: 'Processing',
    ko: '처리 중',
    vi: 'Đang xử lý'
  },
  completed: {
    en: 'Completed',
    ko: '완료됨',
    vi: 'Đã hoàn thành'
  },
  failed: {
    en: 'Failed',
    ko: '실패',
    vi: 'Thất bại'
  },
  remove: {
    en: 'Remove',
    ko: '제거',
    vi: 'Xóa'
  },

  // Preview
  videoPreview: {
    en: 'Video Preview',
    ko: '비디오 미리보기',
    vi: 'Xem trước video'
  },
  finalVideo: {
    en: 'Final Video',
    ko: '최종 비디오',
    vi: 'Video cuối cùng'
  },
  noVideo: {
    en: 'No video pending to render.',
    ko: '렌더링 대기 중인 비디오가 없습니다.',
    vi: 'Không có video nào đang chờ kết xuất.'
  },
  videoDetails: {
    en: 'Video Details',
    ko: '비디오 세부정보',
    vi: 'Chi tiết video'
  },
  files: {
    en: 'Files',
    ko: '파일',
    vi: 'Tệp'
  },
  previewDesc: {
    en: 'Preview will appear here after rendering',
    ko: '렌더링 후 미리보기가 여기에 표시됩니다',
    vi: 'Bản xem trước sẽ xuất hiện ở đây sau khi kết xuất'
  },
  uploadAudioFirst: {
    en: 'Please upload an audio file first',
    ko: '오디오 파일을 먼저 업로드하세요',
    vi: 'Vui lòng tải lên tệp âm thanh trước'
  },
  enterArtistAndTitle: {
    en: 'Please enter artist name and song title',
    ko: '아티스트 이름과 노래 제목을 입력하세요',
    vi: 'Vui lòng nhập tên nghệ sĩ và tên bài hát'
  },

  // Workspace
  metadataPosition: {
    en: 'Metadata Position',
    ko: '메타데이터 위치',
    vi: 'Vị trí siêu dữ liệu'
  },
  metadataWidth: {
    en: 'Metadata Width',
    ko: '메타데이터 너비',
    vi: 'Chiều rộng siêu dữ liệu'
  },
  lyricsLineThreshold: {
    en: 'Lyrics Line Threshold',
    ko: '가사 줄 임계값',
    vi: 'Ngưỡng dòng lời bài hát'
  },
  adjustPreview: {
    en: 'Adjust Preview',
    ko: '미리보기 조정',
    vi: 'Điều chỉnh xem trước'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize language from localStorage or default to 'en'
  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem('language');
    // Ensure saved language is one of the valid types, otherwise default to 'en'
    if (savedLanguage && ['en', 'ko', 'vi'].includes(savedLanguage)) {
       return savedLanguage as Language;
    }
    return 'en';
  });

  // Update localStorage when language changes
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  // Translation function
  const t = (key: string): string => {
    // Check if the key exists and the translation for the current language exists
    if (translations[key] && translations[key][language]) {
      return translations[key][language];
    }
    // Fallback logic: try English, then the key itself
    if (translations[key] && translations[key]['en']) {
        console.warn(`Translation key '${key}' found, but missing translation for language '${language}'. Falling back to English.`);
        return translations[key]['en'];
    }
    // If the key doesn't exist at all
    console.warn(`Translation key not found: ${key}`);
    return key; // Return the key as a fallback
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