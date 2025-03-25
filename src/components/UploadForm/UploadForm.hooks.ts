import { useState, useRef, useCallback } from 'react';
import { analyzeAudio } from '../../utils/audioAnalyzer';
import { LyricEntry } from '../../types';
import { 
  AudioFiles, 
  VideoMetadata 
} from './UploadForm.types';

export const useUploadFormHandlers = (
  initialValues: any,
  onFilesChange: any,
  onVideoPathChange: any
) => {
  const [mainAudioFile, setMainAudioFile] = useState<File | null>(initialValues?.audioFiles.main || null);
  const [instrumentalFile, setInstrumentalFile] = useState<File | null>(initialValues?.audioFiles.instrumental || null);
  const [vocalFile, setVocalFile] = useState<File | null>(initialValues?.audioFiles.vocal || null);
  const [littleVocalFile, setLittleVocalFile] = useState<File | null>(initialValues?.audioFiles.littleVocal || null);
  const [lyrics, setLyrics] = useState<LyricEntry[] | null>(initialValues?.lyrics || null);
  const [lyricsFile, setLyricsFile] = useState<File | null>(initialValues?.lyricsFile || null);
  const [albumArtFile, setAlbumArtFile] = useState<File | null>(initialValues?.albumArtFile || null);
  const [backgroundFiles, setBackgroundFiles] = useState<{ [key: string]: File | null }>(initialValues?.backgroundFiles || {});
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<{[key: string]: boolean}>({});
  const [videoPath, setVideoPath] = useState<string | null>(null);
  const [artist, setArtist] = useState(initialValues?.metadata.artist || '');
  const [songTitle, setSongTitle] = useState(initialValues?.metadata.songTitle || '');
  const [videoType, setVideoType] = useState<'Lyrics Video' | 'Vocal Only' | 'Instrumental Only' | 'Little Vocal'>(
    initialValues?.metadata.videoType || 'Lyrics Video'
  );

  const mainAudioInputRef = useRef<HTMLInputElement>(null);
  const lyricsInputRef = useRef<HTMLInputElement>(null);
  const albumArtInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const instrumentalInputRef = useRef<HTMLInputElement>(null);
  const vocalInputRef = useRef<HTMLInputElement>(null);
  const littleVocalInputRef = useRef<HTMLInputElement>(null);
  const backgroundLyricsInputRef = useRef<HTMLInputElement>(null);
  const backgroundVocalInputRef = useRef<HTMLInputElement>(null);
  const backgroundInstrumentalInputRef = useRef<HTMLInputElement>(null);
  const backgroundLittleVocalInputRef = useRef<HTMLInputElement>(null);

  const debounce = <T extends (...args: any[]) => void>(fn: T, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return function (...args: Parameters<T>) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(null, args), delay);
    };
  };

  const analyzeAudioFile = async (file: File): Promise<void> => {
    if (!file) return;
    
    const url = URL.createObjectURL(file);
    
    try {
      await analyzeAudio(url);
      console.log(`Analysis complete for ${file.name}`);
    } catch (err) {
      console.error(`Error analyzing audio file ${file.name}:`, err);
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  const updateFiles = () => {
    const audioFiles: AudioFiles = {
      main: mainAudioFile,
      instrumental: instrumentalFile,
      vocal: vocalFile,
      littleVocal: littleVocalFile
    };

    const metadata: VideoMetadata = {
      artist,
      songTitle,
      videoType,
      lyricsLineThreshold: 41,
      metadataPosition: -155,
      metadataWidth: 800
    };

    onFilesChange(audioFiles, lyrics, albumArtFile, backgroundFiles, metadata, lyricsFile);
  };

  const debouncedUpdateFiles = useCallback(
    debounce((newMetadata: VideoMetadata) => {
      const completeMetadata = {
        ...newMetadata,
        lyricsLineThreshold: 41,
        metadataPosition: -155,
        metadataWidth: 800
      };
      onFilesChange(
        { main: mainAudioFile, instrumental: instrumentalFile, vocal: vocalFile, littleVocal: littleVocalFile },
        lyrics,
        albumArtFile,
        backgroundFiles,
        completeMetadata,
        lyricsFile
      );
    }, 500),
    [mainAudioFile, instrumentalFile, vocalFile, littleVocalFile, lyrics, albumArtFile, backgroundFiles, lyricsFile]
  );

  const handleMetadataChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    if (name === 'artist') {
      setArtist(value);
    } else if (name === 'songTitle') {
      setSongTitle(value);
    } else if (name === 'videoType') {
      setVideoType(value as VideoMetadata['videoType']);
      onFilesChange(
        { main: mainAudioFile, instrumental: instrumentalFile, vocal: vocalFile, littleVocal: littleVocalFile },
        lyrics,
        albumArtFile,
        backgroundFiles,
        { artist, songTitle, videoType: value as VideoMetadata['videoType'], lyricsLineThreshold: 41, metadataPosition: -155, metadataWidth: 800 },
        lyricsFile
      );
      return;
    }

    const newMetadata: VideoMetadata = {
      artist: name === 'artist' ? value : artist,
      songTitle: name === 'songTitle' ? value : songTitle,
      videoType,
      lyricsLineThreshold: 41,
      metadataPosition: -155,
      metadataWidth: 800
    };
    
    debouncedUpdateFiles(newMetadata);
  };

  const handleAudioChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'main' | 'instrumental' | 'vocal' | 'littleVocal') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('audio/')) {
        setError('Please upload a valid audio file (MP3, WAV)');
        return;
      }
      
      switch(type) {
        case 'main':
          setMainAudioFile(file);
          break;
        case 'instrumental':
          setInstrumentalFile(file);
          break;
        case 'vocal':
          setVocalFile(file);
          break;
        case 'littleVocal':
          setLittleVocalFile(file);
          break;
      }
      
      setError(null);
      await analyzeAudioFile(file);
      updateFiles();
    }
  };

  const handleLyricsChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLyricsFile(file);
      
      try {
        const text = await file.text();
        const parsedLyrics = JSON.parse(text);
        if (!Array.isArray(parsedLyrics)) {
          throw new Error('Lyrics must be an array');
        }
        
        setLyrics(parsedLyrics);
        setError(null);
        onFilesChange(
          { 
            main: mainAudioFile, 
            instrumental: instrumentalFile, 
            vocal: vocalFile, 
            littleVocal: littleVocalFile 
          },
          parsedLyrics,
          albumArtFile,
          backgroundFiles,
          { 
            artist, 
            songTitle, 
            videoType, 
            lyricsLineThreshold: 41, 
            metadataPosition: -155, 
            metadataWidth: 800 
          },
          file
        );
      } catch (err) {
        setError(`Invalid lyrics file: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setLyrics(null);
      }
    }
  };

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>, 
    type: 'albumArt' | 'background', 
    videoType?: VideoMetadata['videoType']
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        setError('Please upload a valid image file (PNG, JPG, etc.)');
        return;
      }
      
      if (type === 'albumArt') {
        setAlbumArtFile(file);
      } else if (videoType) {
        setBackgroundFiles(prev => ({ ...prev, [videoType]: file }));
      } else {
        setBackgroundFiles(prev => ({ ...prev, 'Lyrics Video': file }));
      }
      updateFiles();
      setError(null);
    }
  };

  const handleDragEnter = (e: React.DragEvent, type: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(prev => ({ ...prev, [type]: true }));
  };

  const handleDragLeave = (e: React.DragEvent, type: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(prev => ({ ...prev, [type]: false }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (
    e: React.DragEvent, 
    type: 'main' | 'lyrics' | 'albumArt' | 'background' | 'instrumental' | 'vocal' | 'littleVocal',
    videoType: VideoMetadata['videoType'] = 'Lyrics Video'
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(prev => ({ ...prev, [type]: false }));

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];

      switch (type) {
        case 'main':
          if (!file.type.startsWith('audio/')) {
            setError('Please upload a valid audio file');
            return;
          }
          setMainAudioFile(file);
          await analyzeAudioFile(file);
          break;
        case 'instrumental':
          if (!file.type.startsWith('audio/')) {
            setError('Please upload a valid audio file');
            return;
          }
          setInstrumentalFile(file);
          await analyzeAudioFile(file);
          break;
        case 'vocal':
          if (!file.type.startsWith('audio/')) {
            setError('Please upload a valid audio file');
            return;
          }
          setVocalFile(file);
          await analyzeAudioFile(file);
          break;
        case 'littleVocal':
          if (!file.type.startsWith('audio/')) {
            setError('Please upload a valid audio file');
            return;
          }
          setLittleVocalFile(file);
          await analyzeAudioFile(file);
          break;
        case 'lyrics':
          if (!file.name.endsWith('.json')) {
            setError('Please upload a valid JSON file');
            return;
          }
          setLyricsFile(file);
          try {
            const text = await file.text();
            const parsedLyrics = JSON.parse(text);
            if (Array.isArray(parsedLyrics)) {
              setLyrics(parsedLyrics);
              onFilesChange(
                { 
                  main: mainAudioFile, 
                  instrumental: instrumentalFile, 
                  vocal: vocalFile, 
                  littleVocal: littleVocalFile 
                },
                parsedLyrics,
                albumArtFile,
                backgroundFiles,
                { 
                  artist, 
                  songTitle, 
                  videoType, 
                  lyricsLineThreshold: 41, 
                  metadataPosition: -155, 
                  metadataWidth: 800 
                },
                file
              );
              setError(null);
            } else {
              throw new Error('Invalid lyrics format');
            }
          } catch (err) {
            setError('Invalid lyrics file format');
            setLyrics(null);
            return;
          }
          break;
        case 'albumArt':
        case 'background':
          if (!file.type.startsWith('image/')) {
            setError('Please upload a valid image file');
            return;
          }
          if (type === 'albumArt') {
            setAlbumArtFile(file);
          } else if (videoType) {
            setBackgroundFiles(prev => ({ ...prev, [videoType]: file }));
          } else {
            setBackgroundFiles(prev => ({ ...prev, 'Lyrics Video': file }));
          }
          updateFiles();
          break;
      }
      setError(null);
      updateFiles();
    }
  };

  const handleBulkDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(prev => ({ ...prev, bulk: false }));

    if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return;

    const files = Array.from(e.dataTransfer.files);
    setError(null);

    let detectedMain: File | null = null;
    let detectedInstrumental: File | null = null;
    let detectedVocal: File | null = null;
    let detectedLittleVocal: File | null = null;
    let detectedLyrics: File | null = null;
    let detectedAlbumArt: File | null = null;
    const detectedBackgrounds: { [key: string]: File } = {};
    let backgroundImages: File[] = [];

    for (const file of files) {
      if (file.name.endsWith('.json')) {
        try {
          const text = await file.text();
          const parsedLyrics = JSON.parse(text);
          if (Array.isArray(parsedLyrics)) {
            setLyrics(parsedLyrics);
            detectedLyrics = file;
            continue;
          }
        } catch (err) {
          setError('Invalid lyrics JSON file');
          return;
        }
      }

      if (file.type.startsWith('audio/')) {
        const nameLower = file.name.toLowerCase();
        if (nameLower.includes('[music+vocals]')) {
          detectedLittleVocal = file;
          await analyzeAudioFile(file);
        } else if (nameLower.includes('music') || nameLower.includes('instrumental')) {
          detectedInstrumental = file;
          await analyzeAudioFile(file);
        } else if (nameLower.includes('vocal') || nameLower.includes('voc')) {
          if (nameLower.includes('little') || nameLower.includes('low')) {
            detectedLittleVocal = file;
          } else {
            detectedVocal = file;
          }
          await analyzeAudioFile(file);
        } else {
          detectedMain = file;
          await analyzeAudioFile(file);
        }
        continue;
      }

      if (file.type.startsWith('image/')) {
        const img = new Image();
        const imageUrl = URL.createObjectURL(file);
        
        await new Promise<void>((resolve) => {
          img.onload = () => {
            URL.revokeObjectURL(imageUrl);
            const isSquare = Math.abs(img.width - img.height) <= 2;
            if (isSquare) {
              detectedAlbumArt = file;
            } else {
              backgroundImages.push(file);
            }
            resolve();
          };
          img.src = imageUrl;
        });
      }
    }

    const videoTypes: VideoMetadata['videoType'][] = [
      'Lyrics Video', 'Vocal Only', 'Instrumental Only', 'Little Vocal'
    ];
    
    backgroundImages.forEach((file, index) => {
      if (index < videoTypes.length) {
        detectedBackgrounds[videoTypes[index]] = file;
      }
    });

    if (detectedMain) setMainAudioFile(detectedMain);
    if (detectedInstrumental) setInstrumentalFile(detectedInstrumental);
    if (detectedVocal) setVocalFile(detectedVocal);
    if (detectedLittleVocal) setLittleVocalFile(detectedLittleVocal);
    if (detectedLyrics) setLyricsFile(detectedLyrics);
    if (detectedAlbumArt) setAlbumArtFile(detectedAlbumArt);
    setBackgroundFiles(detectedBackgrounds);

    setTimeout(() => {
      const audioFiles: AudioFiles = {
        main: detectedMain,
        instrumental: detectedInstrumental,
        vocal: detectedVocal,
        littleVocal: detectedLittleVocal
      };

      const metadata: VideoMetadata = {
        artist,
        songTitle,
        videoType,
        lyricsLineThreshold: 41,
        metadataPosition: -155,
        metadataWidth: 800
      };

      onFilesChange(audioFiles, lyrics, detectedAlbumArt, detectedBackgrounds, metadata, detectedLyrics);
    }, 0);
  };

  const resetForm = () => {
    setMainAudioFile(null);
    setInstrumentalFile(null);
    setVocalFile(null);
    setLittleVocalFile(null);
    setLyricsFile(null);
    setAlbumArtFile(null);
    setBackgroundFiles({});
    setLyrics(null);
    setError(null);
    setVideoPath(null);
    setArtist('');
    setSongTitle('');
    setVideoType('Lyrics Video');
    onFilesChange(
      { main: null, instrumental: null, vocal: null, littleVocal: null },
      null,
      null,
      {},
      { artist: '', songTitle: '', videoType: 'Lyrics Video', lyricsLineThreshold: 41, metadataPosition: -155, metadataWidth: 800 },
      null
    );
    
    if (mainAudioInputRef.current) mainAudioInputRef.current.value = '';
    if (lyricsInputRef.current) lyricsInputRef.current.value = '';
    if (albumArtInputRef.current) albumArtInputRef.current.value = '';
    if (backgroundInputRef.current) backgroundInputRef.current.value = '';
    if (instrumentalInputRef.current) instrumentalInputRef.current.value = '';
    if (vocalInputRef.current) vocalInputRef.current.value = '';
    if (littleVocalInputRef.current) littleVocalInputRef.current.value = '';
    if (backgroundLyricsInputRef.current) backgroundLyricsInputRef.current.value = '';
    if (backgroundVocalInputRef.current) backgroundVocalInputRef.current.value = '';
    if (backgroundInstrumentalInputRef.current) backgroundInstrumentalInputRef.current.value = '';
    if (backgroundLittleVocalInputRef.current) backgroundLittleVocalInputRef.current.value = '';
  };

  const handleBackgroundClick = (type: string) => {
    const ref = {
      'Lyrics Video': backgroundLyricsInputRef,
      'Vocal Only': backgroundVocalInputRef,
      'Instrumental Only': backgroundInstrumentalInputRef,
      'Little Vocal': backgroundLittleVocalInputRef
    }[type];
    
    if (ref && ref.current) {
      ref.current.click();
    }
  };

  return {
    mainAudioFile,
    instrumentalFile,
    vocalFile,
    littleVocalFile,
    lyrics,
    lyricsFile,
    albumArtFile,
    backgroundFiles,
    error,
    isDragging,
    videoPath,
    artist,
    songTitle,
    videoType,
    mainAudioInputRef,
    lyricsInputRef,
    albumArtInputRef,
    backgroundInputRef,
    instrumentalInputRef,
    vocalInputRef,
    littleVocalInputRef,
    backgroundLyricsInputRef,
    backgroundVocalInputRef,
    backgroundInstrumentalInputRef,
    backgroundLittleVocalInputRef,
    handleMetadataChange,
    handleAudioChange,
    handleLyricsChange,
    handleImageChange,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handleBulkDrop,
    resetForm,
    handleBackgroundClick
  };
};