import React, { useRef, useState, useEffect } from 'react';
import { Upload, X, FileImage, Cloud, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || "";
const SCOPES = "https://www.googleapis.com/auth/drive.readonly";

export function ImageUploader({ onFiles }) {
  const inputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const accessTokenRef = useRef(null);
  const [pickerApiLoaded, setPickerApiLoaded] = useState(false);
  const [status, setStatus] = useState({ message: '', type: '' });

  // Load Google APIs on mount
  useEffect(() => {
    const gsiScript = document.createElement('script');
    gsiScript.src = 'https://accounts.google.com/gsi/client';
    gsiScript.async = true;
    document.body.appendChild(gsiScript);

    const gapiScript = document.createElement('script');
    gapiScript.src = 'https://apis.google.com/js/api.js';
    gapiScript.async = true;
    gapiScript.onload = () => {
      window.gapi.load('picker', {
        callback: () => {
          setPickerApiLoaded(true);
          console.log('Picker API loaded');
        }
      });
    };
    document.body.appendChild(gapiScript);

    return () => {
      if (gsiScript.parentNode) document.body.removeChild(gsiScript);
      if (gapiScript.parentNode) document.body.removeChild(gapiScript);
    };
  }, []);

  useEffect(() => {
    console.log(status)
  }, [status])

  const authenticate = () => {
    if (!CLIENT_ID || !API_KEY) {
      showStatus('Google Drive is not configured. Set VITE_GOOGLE_CLIENT_ID and VITE_GOOGLE_API_KEY.', 'error');
      return;
    }
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (response) => {
        if (response.error) {
          showStatus('Login failed: ' + response.error, 'error');
          return;
        }
        const token = response.access_token;
        accessTokenRef.current = token;
        showStatus('Login successful!', 'success');
        setIsDialogOpen(false);
        openPicker(token);
      },
    });
    tokenClient.requestAccessToken();
  };

  const openPicker = (token) => {
    const currentToken = token || accessTokenRef.current;
    if (!currentToken) {
      showStatus('Please login first', 'error');
      return;
    }

    if (!pickerApiLoaded) {
      showStatus('Picker API is still loading. Please wait...', 'error');
      return;
    }

    const picker = new window.google.picker.PickerBuilder()
      .addView(window.google.picker.ViewId.DOCS_IMAGES)
      .addView(new window.google.picker.DocsView()
        .setIncludeFolders(true)
        .setMimeTypes('image/png,image/jpeg,image/jpg,image/gif'))
      .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
      .setOAuthToken(currentToken)
      .setDeveloperKey(API_KEY)
      .setCallback(pickerCallback)
      .build();

    picker.setVisible(true);
  };

  const pickerCallback = async (data) => {
    if (data.action === window.google.picker.Action.PICKED) {
      const docs = data.docs || [];
      console.log("Files selected:", docs);
      const files = [];
      for (const doc of docs) {
        try {
          const fileObj = await downloadDriveFile(doc);
          if (fileObj) files.push(fileObj);
        } catch (err) {
          console.error(`Failed to download ${doc.name}:`, err);
          showStatus(`Failed to download ${doc.name}`, 'error');
        }
      }
      if (files.length > 0) {
        await processFiles(files);
        showStatus(`Imported ${files.length} image(s) from Google Drive`, 'success');
      }
    } else if (data.action === window.google.picker.Action.CANCEL) {
      showStatus('Picker cancelled', 'error');
    }
  };

  const downloadDriveFile = async (doc) => {
    const currentToken = accessTokenRef.current;
    showStatus(`Downloading ${doc.name}...`, 'success');

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(doc.id)}?alt=media`,
      { headers: { 'Authorization': `Bearer ${currentToken}` } }
    );

    if (!response.ok) {
      throw new Error(`Failed to download ${doc.name} (${response.status})`);
    }

    const blob = await response.blob();
    return new File([blob], doc.name, { type: doc.mimeType || 'image/jpeg' });
  };

  const showStatus = (message, type) => {
    setStatus({ message, type });
  };

  const handlePickFiles = () => {
    inputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []).filter((f) =>
      f.type.startsWith("image/")
    );
    if (files.length) {
      await processFiles(files);
    }
    e.target.value = "";
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files || []).filter((f) =>
      f.type.startsWith("image/")
    );
    if (files.length) {
      await processFiles(files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const processFiles = async (files) => {
    setIsUploading(true);
    setUploadProgress(0);

    const processed = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const processedFile = await processFile(file);
        processed.push(processedFile);
        setUploadProgress(((i + 1) / files.length) * 100);
      } catch (error) {
        console.error("Error processing file:", file.name, error);
      }
    }

    setSelectedFiles(processed);
    onFiles(processed);
    setIsUploading(false);
    setUploadProgress(0);
  };

  const removeFile = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onFiles(newFiles);
  };


  return (
    <div className="w-full max-w-2xl mx-auto">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer ${
          isDragOver
            ? "border-blue-500 bg-blue-50 scale-105"
            : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
        }`}
      >
        <p>{"Drag & drop images here"}</p>
        <p className="text-xs text-gray-500 mt-1">
          {"PNG, JPG up to browser limits"}
        </p>
        <Button onClick={() => setIsDialogOpen(true)} variant="outline" className="mt-3">
          <Upload className="w-4 h-4 mr-2" />
          {"Select Images"}
        </Button>

        {isUploading && (
          <div className="mt-6">
            <Progress value={uploadProgress} className="w-full" />
            <p className="text-sm text-gray-600 mt-2">
              Processing... {Math.round(uploadProgress)}%
            </p>
          </div>
        )}
      </div>

      {/* Selected Files Preview */}
      {/* {selectedFiles.length > 0 && (
        <div className="mt-6">
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
                  <X className="w-4 h-4" />
                </button>
                <p className="text-xs text-gray-600 mt-1 truncate">{file.name}</p>
              </div>
            ))}
          </div>
        </div>
      )} */}

      {/* Upload Options Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen} >
        <DialogContent className="bg-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Import Images</DialogTitle>
            <DialogDescription>
              Choose how you want to add images to your project
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <Button
              variant="outline"
              className="h-auto p-4 justify-start"
              onClick={() => {
                handlePickFiles();
                setIsDialogOpen(false);
              }}
            >
              <FileImage className="w-6 h-6 mr-3 text-blue-600" />
              <div className="text-left">
                <div className="font-medium">From Device</div>
                <div className="text-sm text-gray-500">Upload from your computer</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 justify-start"
              // disabled
              // onClick={() => {
              //   // TODO: Implement Google Drive integration
              //   setIsDialogOpen(false);
              // }}
              onClick={authenticate}
            >
              <Cloud className="w-6 h-6 mr-3 text-green-600" />
              <div className="text-left">
                <div className="font-medium">From Google Drive</div>
                <div className="text-sm text-gray-500">Select images from your Drive</div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

ImageUploader.defaultProps = {
  onFiles: () => {},
};

async function processFile(file) {
  const dataUrl = await readAsDataURL(file);
  const { width, height } = await getImageMeta(dataUrl);
  return {
    id: `${file.name}-${Math.random().toString(36).slice(2, 8)}`,
    name: file.name,
    url: dataUrl, // persistable
    width,
    height,
    file, // keep reference to original File
    preview: URL.createObjectURL(file), // for image preview
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
    img.crossOrigin = "anonymous";
    img.onload = () =>
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = src;
  });
}