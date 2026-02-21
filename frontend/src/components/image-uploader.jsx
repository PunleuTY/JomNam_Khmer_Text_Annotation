import React, { useRef, useState, useEffect } from 'react';
import { Upload, X, FileImage, Cloud, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const CLIENT_ID = "904470385009-kq9nevcsb7kse1nmfnnjkpdufvg3h10m.apps.googleusercontent.com";
const API_KEY = "AIzaSyDmV1USf7ifBtVwUlAHAi6N2koystwBuoQ";
const SCOPES = "https://www.googleapis.com/auth/drive";

// ─── Token management (in-memory only — localStorage not available here) ──────
let _memoryToken = null;
let _memoryTokenExpiry = null;

// ─── Unique ID generator ──────────────────────────────────────────────────────
let _idCounter = 0;
function generateUniqueId(fileName) {
  const timestamp = Date.now();
  const counter = ++_idCounter;
  const randomPart = Math.random().toString(16).slice(2, 10); // More precision
  return `${fileName}-${timestamp}-${counter}-${randomPart}`;
}

function saveToken(token, expiresIn = 3600) {
  _memoryToken = token;
  _memoryTokenExpiry = Date.now() + expiresIn * 1000;
}

function getStoredToken() {
  if (_memoryToken && _memoryTokenExpiry && Date.now() < _memoryTokenExpiry) {
    return _memoryToken;
  }
  _memoryToken = null;
  _memoryTokenExpiry = null;
  return null;
}

function clearToken() {
  _memoryToken = null;
  _memoryTokenExpiry = null;
}

// ─── Download a Drive file as a Blob using XMLHttpRequest ────────────────────
// fetch() with Drive's alt=media endpoint is blocked by CORS in many browsers.
// XHR with responseType:'blob' works reliably.
function downloadDriveFileAsBlob(fileId, accessToken) {
  return new Promise((resolve, reject) => {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
    xhr.responseType = 'blob';
    xhr.onload = () => {
      if (xhr.status === 200) {
        resolve(xhr.response); // Blob
      } else if (xhr.status === 401) {
        reject(new Error('UNAUTHORIZED'));
      } else if (xhr.status === 403) {
        reject(new Error('FORBIDDEN'));
      } else {
        reject(new Error(`Download failed with status ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error('Network error during download'));
    xhr.send();
  });
}

// ─── Component ────────────────────────────────────────────────────────────────
export function ImageUploader({ onFiles }) {
  const inputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [accessToken, setAccessToken] = useState(null);
  const [pickerApiLoaded, setPickerApiLoaded] = useState(false);
  const [gsiLoaded, setGsiLoaded] = useState(false);
  const [isAuthInProgress, setIsAuthInProgress] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ message: '', type: '' });
  const [error, setError] = useState('');

  // ── Load Google APIs once ──────────────────────────────────────────────────
  useEffect(() => {
    // Restore token if still valid
    const stored = getStoredToken();
    if (stored) {
      setAccessToken(stored);
      setIsLoggedIn(true);
    }

    const gsiScript = document.createElement('script');
    gsiScript.src = 'https://accounts.google.com/gsi/client';
    gsiScript.async = true;
    gsiScript.onload = () => setGsiLoaded(true);
    document.body.appendChild(gsiScript);

    const gapiScript = document.createElement('script');
    gapiScript.src = 'https://apis.google.com/js/api.js';
    gapiScript.async = true;
    gapiScript.onload = () => {
      window.gapi.load('picker', {
        callback: () => setPickerApiLoaded(true),
      });
    };
    document.body.appendChild(gapiScript);

    return () => {
      if (document.body.contains(gsiScript)) document.body.removeChild(gsiScript);
      if (document.body.contains(gapiScript)) document.body.removeChild(gapiScript);
    };
  }, []);

  // ── Auth ───────────────────────────────────────────────────────────────────
  const authenticate = () => {
    setError('');
    if (!window.google) {
      setError('Google APIs not yet loaded. Please wait a moment and try again.');
      return;
    }

    try {
      setIsAuthInProgress(true);
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (response) => {
          setIsAuthInProgress(false);
          if (response.error) {
            setError('Login failed: ' + response.error);
            return;
          }

          const token = response.access_token;
          saveToken(token, response.expires_in || 3600);
          setAccessToken(token);
          setIsLoggedIn(true);
          setError('');
          setIsDialogOpen(false);

          // Open picker immediately after login
          setTimeout(() => openPicker(token), 300);
        },
      });

      // Use 'select_account' so users can switch accounts; use '' (empty) to skip
      // the account chooser if already signed in and just want a fresh token.
      tokenClient.requestAccessToken({ prompt: '' });
    } catch (err) {
      setIsAuthInProgress(false);
      setError('Authentication error: ' + err.message);
    }
  };

  const logout = () => {
    clearToken();
    setAccessToken(null);
    setIsLoggedIn(false);
    setIsDialogOpen(false);
  };

  // ── Picker ─────────────────────────────────────────────────────────────────
  const openPicker = (token) => {
    const tok = token || accessToken;
    if (!tok) {
      setIsDialogOpen(true);
      setError('Please sign in to Google Drive first.');
      return;
    }
    if (!pickerApiLoaded) {
      setError('Google Picker is still loading. Please try again in a moment.');
      return;
    }

    setError('');

    const picker = new window.google.picker.PickerBuilder()
      .addView(window.google.picker.ViewId.DOCS_IMAGES)
      .addView(
        new window.google.picker.DocsView()
          .setIncludeFolders(true)
          .setMimeTypes('image/png,image/jpeg,image/jpg,image/gif,image/webp')
      )
      .setOAuthToken(tok)
      .setDeveloperKey(API_KEY)
      .setCallback((data) => pickerCallback(data, tok))
      .build();

    picker.setVisible(true);
  };

  const pickerCallback = async (data, tok) => {
    if (data.action === window.google.picker.Action.PICKED) {
      const driveFile = data.docs[0];

      if (!driveFile.mimeType?.startsWith('image/')) {
        setError('Please select an image file.');
        return;
      }

      await downloadAndProcess(driveFile, tok || accessToken);
    }
  };

  // ── Download from Drive ────────────────────────────────────────────────────
  const downloadAndProcess = async (driveFile, tok) => {
    setIsUploading(true);
    setUploadProgress(10);
    setStatusMsg({ message: `Downloading ${driveFile.name}…`, type: 'info' });

    try {
      const blob = await downloadDriveFileAsBlob(driveFile.id, tok);
      setUploadProgress(70);

      const mimeType = blob.type || driveFile.mimeType || 'image/jpeg';
      const fileObj = new File([blob], driveFile.name, { type: mimeType });

      const processed = await processFile(fileObj);
      setUploadProgress(100);

      // Use functional update to read the LATEST state, not the stale closure value.
      // Deduplicate: remove files with same Drive ID OR same dimensions
      setSelectedFiles((prev) => {
        // Check if this file is a duplicate
        const isDuplicate = prev.some(
          (f) =>
            f.driveId === driveFile.id ||
            (f.width === processed.width &&
              f.height === processed.height &&
              Math.abs((f.file?.size || 0) - (processed.file?.size || 0)) < 1000)
        );

        if (isDuplicate) {
          setStatusMsg({
            message: `"${driveFile.name}" is a duplicate and was skipped.`,
            type: 'info'
          });
          return prev; // Don't add duplicate
        }

        const newFile = { ...processed, driveId: driveFile.id };
        const updated = [...prev, newFile];
        // Only pass the newly added file
        onFiles([newFile]);
        return updated;
      });
      setStatusMsg({ message: `${driveFile.name} added!`, type: 'success' });
    } catch (err) {
      if (err.message === 'UNAUTHORIZED') {
        // Token expired mid-session — force re-auth
        clearToken();
        setAccessToken(null);
        setIsLoggedIn(false);
        setIsDialogOpen(true);
        setError('Your session expired. Please sign in again.');
      } else if (err.message === 'FORBIDDEN') {
        setError(`Access denied to "${driveFile.name}". Make sure the file is accessible to your account.`);
      } else {
        setError(`Failed to download "${driveFile.name}": ${err.message}`);
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // ── Local file handling ────────────────────────────────────────────────────
  const handlePickFiles = () => inputRef.current?.click();

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []).filter((f) =>
      f.type.startsWith('image/')
    );
    if (files.length) await processLocalFiles(files);
    e.target.value = '';
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files || []).filter((f) =>
      f.type.startsWith('image/')
    );
    if (files.length) await processLocalFiles(files);
  };

  const processLocalFiles = async (files) => {
    setIsUploading(true);
    setUploadProgress(0);
    const processed = [];
    for (let i = 0; i < files.length; i++) {
      try {
        const p = await processFile(files[i]);
        processed.push(p);
        setUploadProgress(((i + 1) / files.length) * 100);
      } catch (err) {
        console.error('Error processing', files[i].name, err);
      }
    }

    // First: deduplicate within the processed batch itself
    const uniqueProcessed = [];
    for (const file of processed) {
      const isDuplicate = uniqueProcessed.some(
        (existing) =>
          (file.width === existing.width &&
            file.height === existing.height &&
            Math.abs((file.file?.size || 0) - (existing.file?.size || 0)) < 1000) ||
          (file.name === existing.name && file.file?.size === existing.file?.size)
      );
      if (!isDuplicate) {
        uniqueProcessed.push(file);
      }
    }

    // Use functional update to always append to the LATEST state
    setSelectedFiles((prev) => {
      const result = [...prev];
      const newlyAdded = [];
      let addedCount = 0;
      let skippedCount = 0;

      // For each unique file from this batch, check against ALL existing files
      for (const newFile of uniqueProcessed) {
        const isDuplicate = result.some(
          (existing) =>
            (newFile.width === existing.width &&
              newFile.height === existing.height &&
              Math.abs((newFile.file?.size || 0) - (existing.file?.size || 0)) < 1000) ||
            (newFile.name === existing.name && newFile.file?.size === existing.file?.size)
        );

        if (!isDuplicate) {
          result.push(newFile);
          newlyAdded.push(newFile);
          addedCount++;
        } else {
          skippedCount++;
        }
      }

      // Notify user about duplicates
      if (skippedCount > 0) {
        setStatusMsg({
          message: `Added ${addedCount} image(s). ${skippedCount} duplicate(s) were skipped.`,
          type: 'info'
        });
      }

      // Only pass newly added files to avoid duplicates in parent component
      onFiles(newlyAdded);
      return result;
    });
    setIsUploading(false);
    setUploadProgress(0);
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      onFiles(updated);
      return updated;
    });
  };

  const apisReady = gsiLoaded && pickerApiLoaded;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer ${
          isDragOver
            ? 'border-blue-500 bg-blue-50 scale-105'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        }`}
      >
        <p className="text-gray-700 font-medium">Drag & drop images here</p>
        <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF, WEBP</p>

        {isLoggedIn && (
          <div className="flex items-center justify-center gap-1 text-sm text-green-600 mt-2">
            <CheckCircle className="w-4 h-4" />
            Google Drive connected
          </div>
        )}

        <Button
          onClick={() => setIsDialogOpen(true)}
          variant="outline"
          className="mt-3"
          disabled={isUploading}
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Upload className="w-4 h-4 mr-2" />
          )}
          {isUploading ? 'Processing…' : 'Select Images'}
        </Button>

        {isUploading && (
          <div className="mt-4">
            <Progress value={uploadProgress} className="w-full" />
            <p className="text-sm text-gray-600 mt-1">
              {statusMsg.message || `Processing… ${Math.round(uploadProgress)}%`}
            </p>
          </div>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
          <button className="ml-auto text-red-500 hover:text-red-700" onClick={() => setError('')}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Preview grid */}
      {selectedFiles.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            Selected Images ({selectedFiles.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {selectedFiles.map((file, index) => (
              <div key={file.id} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={file.preview}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
                <p className="text-xs text-gray-600 mt-1 truncate">{file.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Import Images</DialogTitle>
            <DialogDescription>
              {isLoggedIn
                ? 'Pick from your device or Google Drive'
                : 'Upload from your device or connect Google Drive'}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid gap-3 py-2">
            {/* Device upload */}
            <Button
              variant="outline"
              className="h-auto p-4 justify-start"
              onClick={() => {
                setIsDialogOpen(false);
                handlePickFiles();
              }}
            >
              <FileImage className="w-6 h-6 mr-3 text-blue-600 shrink-0" />
              <div className="text-left">
                <div className="font-medium">From Device</div>
                <div className="text-sm text-gray-500">Upload from your computer</div>
              </div>
            </Button>

            {/* Google Drive — if already logged in, open picker directly */}
            {isLoggedIn ? (
              <Button
                variant="outline"
                className="h-auto p-4 justify-start"
                onClick={() => {
                  setIsDialogOpen(false);
                  openPicker();
                }}
                disabled={!apisReady}
              >
                <Cloud className="w-6 h-6 mr-3 text-green-600 shrink-0" />
                <div className="text-left">
                  <div className="font-medium">From Google Drive</div>
                  <div className="text-sm text-gray-500">Already signed in — open picker</div>
                </div>
              </Button>
            ) : (
              <Button
                variant="outline"
                className="h-auto p-4 justify-start"
                onClick={authenticate}
                disabled={!apisReady || isAuthInProgress}
                title={!apisReady ? 'Google APIs still loading…' : ''}
              >
                {isAuthInProgress ? (
                  <Loader2 className="w-6 h-6 mr-3 text-green-600 shrink-0 animate-spin" />
                ) : (
                  <Cloud className="w-6 h-6 mr-3 text-green-600 shrink-0" />
                )}
                <div className="text-left">
                  <div className="font-medium">From Google Drive</div>
                  <div className="text-sm text-gray-500">
                    {!apisReady ? 'Loading Google APIs…' : 'Sign in to access your files'}
                  </div>
                </div>
              </Button>
            )}

            {/* Logout */}
            {isLoggedIn && (
              <Button variant="ghost" className="text-gray-500 text-sm h-8" onClick={logout}>
                Sign out from Google Drive
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

ImageUploader.defaultProps = {
  onFiles: () => {},
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function processFile(file) {
  const dataUrl = await readAsDataURL(file);
  const { width, height } = await getImageMeta(dataUrl);
  return {
    id: generateUniqueId(file.name),
    name: file.name,
    url: dataUrl,
    width,
    height,
    file,
    preview: URL.createObjectURL(file),
  };
}

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getImageMeta(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = src;
  });
}
