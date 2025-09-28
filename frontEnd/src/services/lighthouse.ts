import lighthouse from '@lighthouse-web3/sdk';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/v1';

export interface LighthouseFile {
  Name: string;
  Hash: string;
  Size: string;
}

export interface UploadResponse {
  data: LighthouseFile;
}

export interface FileListResponse {
  data: {
    fileList: Array<{
      id: string;
      fileName: string;
      cid: string;
      fileSizeInBytes: string;
      createdAt: number;
      mimeType: string;
      encryption: boolean;
    }>;
    totalFiles: number;
  };
}

class LighthouseService {
  private apiKey: string | null = null;

  // Get API key from backend (encrypted and stored per user)
  async getApiKey(): Promise<string> {
    if (this.apiKey) {
      return this.apiKey;
    }

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('User not authenticated');
      }

      const response = await axios.get(`${API_BASE_URL}/users/lighthouse-key`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        this.apiKey = response.data.data.apiKey;
        return this.apiKey;
      } else {
        throw new Error('Failed to get Lighthouse API key');
      }
    } catch (error) {
      console.error('Error getting Lighthouse API key:', error);
      throw error;
    }
  }

  // Generate new API key for user
  async generateApiKey(signer: any): Promise<string> {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('User not authenticated');
      }

      const response = await axios.post(`${API_BASE_URL}/users/generate-lighthouse-key`, {
        signer: signer
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        this.apiKey = response.data.data.apiKey;
        return this.apiKey;
      } else {
        throw new Error('Failed to generate Lighthouse API key');
      }
    } catch (error) {
      console.error('Error generating Lighthouse API key:', error);
      throw error;
    }
  }

  // Upload file to Lighthouse
  async uploadFile(file: File, progressCallback?: (progress: any) => void): Promise<UploadResponse> {
    try {
      const apiKey = await this.getApiKey();
      
      const uploadResponse = await lighthouse.upload(
        file,
        apiKey,
        null,
        progressCallback
      );

      return uploadResponse;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  // Upload file with buffer (for Node.js backend)
  async uploadBuffer(buffer: Buffer, fileName: string): Promise<UploadResponse> {
    try {
      const apiKey = await this.getApiKey();
      
      const uploadResponse = await lighthouse.uploadBuffer(
        buffer,
        apiKey
      );

      return uploadResponse;
    } catch (error) {
      console.error('Error uploading buffer:', error);
      throw error;
    }
  }

  // Get file list from Lighthouse
  async getFileList(lastKey?: string): Promise<FileListResponse> {
    try {
      const apiKey = await this.getApiKey();
      
      const response = await lighthouse.getUploads(apiKey, lastKey);
      return response;
    } catch (error) {
      console.error('Error getting file list:', error);
      throw error;
    }
  }

  // Delete file from Lighthouse
  async deleteFile(fileId: string): Promise<{ message: string }> {
    try {
      const apiKey = await this.getApiKey();
      
      const response = await lighthouse.deleteFile(apiKey, fileId);
      return { message: 'File deleted successfully' };
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  // Get file info
  async getFileInfo(cid: string): Promise<any> {
    try {
      const response = await lighthouse.getFileInfo(cid);
      return response;
    } catch (error) {
      console.error('Error getting file info:', error);
      throw error;
    }
  }

  // Get file from IPFS gateway
  getFileUrl(cid: string): string {
    return `https://gateway.lighthouse.storage/ipfs/${cid}`;
  }

  // Verify file access
  async verifyFileAccess(cid: string): Promise<boolean> {
    try {
      const url = this.getFileUrl(cid);
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.error('Error verifying file access:', error);
      return false;
    }
  }

  // Get signed message for encryption operations
  async getSignedMessage(publicKey: string): Promise<string> {
    try {
      // Use Lighthouse SDK instead of direct API call
      const response = await lighthouse.getAuthMessage(publicKey);
      // Return the message from the response data
      return response.data.message;
    } catch (error) {
      console.error('Error getting signed message:', error);
      throw error;
    }
  }

  // Decrypt file for viewing
  async decryptFile(cid: string, publicKey: string, signedMessage: string): Promise<string> {
    try {
      console.log('🔓 Decrypting file...', { 
        cid: cid.substring(0, 20) + '...', 
        publicKey: publicKey.substring(0, 10) + '...',
        signature: signedMessage.substring(0, 20) + '...'
      });
      
      // Step 1: Get the encryption key using the signed message
      console.log('🔑 Fetching encryption key...');
      const fileEncryptionKey = await lighthouse.fetchEncryptionKey(
        cid,
        publicKey,
        signedMessage
      );
      
      console.log('✅ Encryption key fetched:', fileEncryptionKey);
      
      if (!fileEncryptionKey?.data?.key) {
        throw new Error('Failed to fetch encryption key');
      }
      
      // Step 2: Decrypt the file using the encryption key
      console.log('🔓 Decrypting file with encryption key...');
      const decryptedBlob = await lighthouse.decryptFile(
        cid,
        fileEncryptionKey.data.key
      );
      
      console.log('✅ File decrypted successfully');
      console.log('📊 Decrypted blob details:', {
        type: typeof decryptedBlob,
        size: decryptedBlob?.size || 'unknown',
        constructor: decryptedBlob?.constructor?.name || 'unknown'
      });
      
      // Create object URL from the decrypted blob
      const url = URL.createObjectURL(decryptedBlob);
      console.log('🔗 Object URL created:', url.substring(0, 50) + '...');
      return url;
      
    } catch (error) {
      console.error('❌ Error decrypting file:', error);
      console.error('📊 Error details:', {
        message: error.message,
        stack: error.stack?.substring(0, 200) + '...'
      });
      throw error;
    }
  }

  // Share encrypted file with buyer
  async shareFile(cid: string, ownerPublicKey: string, buyerPublicKey: string, signedMessage: string): Promise<any> {
    try {
      console.log('🤝 Sharing encrypted file...', {
        cid: cid.substring(0, 20) + '...',
        ownerPublicKey: ownerPublicKey.substring(0, 10) + '...',
        buyerPublicKey: buyerPublicKey.substring(0, 10) + '...',
        signature: signedMessage.substring(0, 20) + '...'
      });

      const shareResponse = await lighthouse.shareFile(
        ownerPublicKey,
        [buyerPublicKey],
        cid,
        signedMessage
      );

      console.log('✅ File shared successfully:', shareResponse);
      return shareResponse;
    } catch (error: any) {
      console.error('❌ Error sharing file:', error);
      throw error;
    }
  }
}

export default new LighthouseService();
