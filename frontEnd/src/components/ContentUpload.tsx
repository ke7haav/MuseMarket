import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, X, File, Image, Music, Video, BookOpen } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { contentAPI } from '@/services/api';
import lighthouseService from '@/services/lighthouse';

interface ContentUploadProps {
  onUploadSuccess?: () => void;
}

const ContentUpload: React.FC<ContentUploadProps> = ({ onUploadSuccess }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    type: 'music' as 'music' | 'ebook' | 'video' | 'course'
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isConnected, user } = useWallet();

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'music': return <Music className="w-6 h-6" />;
      case 'video': return <Video className="w-6 h-6" />;
      case 'ebook': return <BookOpen className="w-6 h-6" />;
      case 'course': return <File className="w-6 h-6" />;
      default: return <File className="w-6 h-6" />;
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Check if we're on mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const handleFileSelect = (file: File) => {
    // Validate file type - expanded for mobile
    const allowedTypes = [
      'audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/mp4', 'audio/aac', 'audio/ogg',
      'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm',
      'application/pdf',
      'image/jpeg', 'image/png', 'image/gif', 'image/webp'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid file type (audio, video, PDF, or image)');
      return;
    }

    // File size limits - much higher since Filecoin supports up to 24GB
    const maxSize = isMobile ? 500 * 1024 * 1024 : 2 * 1024 * 1024 * 1024; // 500MB on mobile, 2GB on desktop
    if (file.size > maxSize) {
      const maxSizeGB = isMobile ? 0.5 : 2;
      const maxSizeUnit = isMobile ? 'MB' : 'GB';
      alert(`File size must be less than ${maxSizeGB}${maxSizeUnit}`);
      return;
    }

    setSelectedFile(file);
    
    // Auto-detect content type based on file type
    if (file.type.startsWith('audio/')) {
      setFormData(prev => ({ ...prev, type: 'music' }));
    } else if (file.type.startsWith('video/')) {
      setFormData(prev => ({ ...prev, type: 'video' }));
    } else if (file.type === 'application/pdf') {
      setFormData(prev => ({ ...prev, type: 'ebook' }));
    } else if (file.type.startsWith('image/')) {
      setFormData(prev => ({ ...prev, type: 'video' })); // Treat images as video for now
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    if (!selectedFile) {
      alert('Please select a file to upload');
      return;
    }

    if (!formData.title.trim()) {
      alert('Please enter a title');
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      alert('Please enter a valid price');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
        // Get signed message for encryption
        console.log('🔐 Getting signed message for encryption...');
        
        if (!window.ethereum) {
          throw new Error('MetaMask is not installed');
        }
        
        // Get accounts first
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        
        if (accounts.length === 0) {
          throw new Error('No accounts found');
        }
        
        const signerAddress = accounts[0];
        
        // Get auth message from Lighthouse using the signer address
        const authResponse = await lighthouseService.getSignedMessage(signerAddress);
        
        if (!authResponse) {
          throw new Error('Failed to get auth message from Lighthouse');
        }
        
        // Sign the message with MetaMask
        const signedMessage = await window.ethereum.request({
          method: 'personal_sign',
          params: [authResponse, signerAddress],
        });
        
        console.log('✅ Message signed successfully');

      // Create FormData for backend
      const uploadData = new FormData();
      uploadData.append('file', selectedFile);
      uploadData.append('title', formData.title);
      uploadData.append('description', formData.description);
      uploadData.append('price', formData.price);
      uploadData.append('type', formData.type);
      uploadData.append('signedMessage', signedMessage);

      console.log('📤 Uploading encrypted content:', {
        title: formData.title,
        type: formData.type,
        price: formData.price,
        fileSize: selectedFile.size,
        encrypted: true
      });

      // Upload to backend (which will handle encrypted Lighthouse upload)
      const response = await contentAPI.createContent(uploadData);

      if (response.data.success) {
        console.log('✅ Encrypted upload successful!', response.data.data);
        alert('Encrypted content uploaded successfully!');
        setFormData({
          title: '',
          description: '',
          price: '',
          type: 'music'
        });
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        onUploadSuccess?.();
      } else {
        throw new Error(response.data.message || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      alert(error.response?.data?.message || error.message || 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground mb-4">
          <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <p className="text-lg font-medium">Connect your wallet to upload content</p>
          <p className="text-sm">You need to connect your wallet to start uploading content to MuseMarket.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Upload Area */}
        <div
          className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${
            dragActive
              ? 'border-primary bg-primary/5'
              : selectedFile
              ? 'border-secondary bg-secondary/5'
              : 'border-border hover:border-primary/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            accept={isMobile ? "audio/*,video/*,application/pdf,image/*,camera" : "audio/*,video/*,application/pdf,image/*"}
            capture={isMobile ? "environment" : undefined} // Enable camera on mobile
          />
          
          {selectedFile ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-3">
                {getFileIcon(formData.type)}
                <div className="text-left">
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  className="p-1 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
              <div>
                <p className="text-lg font-medium">
                  {isMobile ? 'Tap to select a file' : 'Drop your file here'}
                </p>
                <p className="text-muted-foreground">
                  {isMobile ? (
                    <>
                      or <span className="text-primary">take a photo/video</span>
                    </>
                  ) : (
                    <>
                      or <span className="text-primary">browse</span> to select a file
                    </>
                  )}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Supports audio, video, PDF, and image files up to {isMobile ? '500MB' : '2GB'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Content Details */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter content title"
              className="input-primary w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Price (PYUSD) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
              placeholder="0.00"
              className="input-primary w-full"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Content Type</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
            className="input-primary w-full"
          >
            <option value="music">Music</option>
            <option value="video">Video</option>
            <option value="ebook">eBook</option>
            <option value="course">Course</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe your content..."
            rows={4}
            className="input-primary w-full"
          />
        </div>


        {/* Upload Progress */}
        {isUploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uploading to Filecoin...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isUploading || !selectedFile}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? 'Uploading...' : 'Upload Content'}
        </button>
      </form>
    </div>
  );
};

export default ContentUpload;
