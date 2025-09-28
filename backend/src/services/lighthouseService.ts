import axios from 'axios';
import lighthouse from '@lighthouse-web3/sdk';

export class LighthouseService {
  /**
   * Generate a Lighthouse API key for a user
   * @param publicKey - User's wallet public key
   * @param signedMessage - Message signed by the user's wallet
   * @returns Promise<string> - The generated API key
   */
  static async generateApiKey(publicKey: string, signedMessage: string): Promise<string> {
    try {
      console.log('🔑 Generating Lighthouse API key for:', publicKey);
      console.log('📝 Public key:', publicKey);
      console.log('✍️ Signed message:', signedMessage);
      
      // Use the correct Lighthouse API flow
      // Step 1: Get authentication message (we already have this from the frontend)
      // Step 2: Create API key using the signed message
      
      console.log('🔄 Creating Lighthouse API key using correct API...');
      const response = await axios.post('https://api.lighthouse.storage/api/auth/create_api_key', {
        publicKey: publicKey,
        signedMessage: signedMessage,
        keyName: `MuseMarket_${publicKey.slice(2, 10)}_${Date.now()}` // Generate a unique key name
      });
      
      console.log('📡 Raw Lighthouse API response:', response.data);
      
      // Check if the response contains the API key
      if (response.data && response.data.apiKey) {
        console.log('✅ Lighthouse API key generated successfully');
        return response.data.apiKey;
      }
      
      if (response.data && response.data.data && response.data.data.apiKey) {
        console.log('✅ Lighthouse API key generated successfully (nested)');
        return response.data.data.apiKey;
      }
      
      // Check if the response is directly the API key string
      if (typeof response.data === 'string' && response.data.length > 0) {
        console.log('✅ Lighthouse API key generated successfully (direct string)');
        return response.data;
      }
      
      // If we get here, the response structure is unexpected
      console.error('❌ Unexpected Lighthouse API response structure:', response.data);
      throw new Error('Unexpected response structure from Lighthouse API');
      
    } catch (error: any) {
      console.error('❌ Error generating Lighthouse API key:', error);
      console.error('❌ Error details:', error.message);
      if (error.response) {
        console.error('❌ API Response:', error.response.data);
      }
      throw new Error(`Failed to generate Lighthouse API key: ${error.message}`);
    }
  }

  /**
   * Get authentication message for signing
   * @param publicKey - User's wallet public key
   * @returns Promise<string> - The message to be signed
   */
  static async getAuthMessage(publicKey: string): Promise<string> {
    try {
      const response = await axios.get(
        `https://api.lighthouse.storage/api/auth/get_message?publicKey=${publicKey}`
      );
      return response.data;
    } catch (error: any) {
      console.error('❌ Error getting auth message:', error);
      throw new Error(`Failed to get auth message: ${error.message}`);
    }
  }

  /**
   * Upload a file to Lighthouse
   * @param file - File to upload
   * @param apiKey - User's Lighthouse API key
   * @param onProgress - Progress callback
   * @returns Promise<any> - Upload response
   */
  static async uploadFile(file: any, apiKey: string, onProgress?: (progress: number) => void): Promise<any> {
    try {
      console.log('📤 Uploading file to Lighthouse...');
      console.log('📁 File details:', {
        name: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        path: file.path
      });
      
      // Use the file path from multer for Lighthouse upload
      const response = await lighthouse.upload(
        file.path, // Use file path instead of file object
        apiKey,
        1, // cidVersion - use version 1
        (progressData: any) => {
          if (onProgress && progressData?.total && progressData?.uploaded) {
            const percentageDone = 100 - (progressData.total / progressData.uploaded) * 100;
            onProgress(Math.max(0, Math.min(100, percentageDone)));
          }
        }
      );
      
      console.log('✅ File uploaded successfully!');
      console.log('📊 Upload response:', response.data);
      console.log('🔗 File available at:', `https://gateway.lighthouse.storage/ipfs/${response.data.Hash}`);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Error uploading file:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * List user's uploaded files
   * @param apiKey - User's Lighthouse API key
   * @param lastKey - Pagination key
   * @returns Promise<any> - List of files
   */
  static async listFiles(apiKey: string, lastKey?: string): Promise<any> {
    try {
      console.log('📂 Listing files from Lighthouse...');
      
      const response = await lighthouse.getUploads(apiKey, lastKey || undefined);
      
      console.log('✅ Files listed successfully');
      console.log('📊 Found files:', response.data?.fileList?.length || 0);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error listing files:', error);
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }

  /**
   * Get file information
   * @param cid - Content ID of the file
   * @returns Promise<any> - File information
   */
  static async getFileInfo(cid: string): Promise<any> {
    try {
      console.log('ℹ️ Getting file info for CID:', cid);
      
      const response = await lighthouse.getFileInfo(cid);
      
      console.log('✅ File info retrieved successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ Error getting file info:', error);
      throw new Error(`Failed to get file info: ${error.message}`);
    }
  }

  /**
   * Delete a file from Lighthouse
   * @param fileId - Lighthouse file ID (UUID) of the file to delete
   * @param apiKey - User's Lighthouse API key
   * @returns Promise<any> - Delete response
   */
  static async deleteFile(fileId: string, apiKey: string): Promise<any> {
    try {
      console.log('🗑️ Deleting file from Lighthouse...');
      console.log('📁 File ID:', fileId);

      const response = await lighthouse.deleteFile(apiKey, fileId);

      console.log('✅ File deleted successfully from Lighthouse');
      return response.data;
    } catch (error: any) {
      console.error('❌ Error deleting file:', error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }


  /**
   * Upload a file with encryption
   * @param file - File to upload
   * @param apiKey - User's Lighthouse API key
   * @param publicKey - User's public key for encryption
   * @param signedMessage - Signed message for authentication
   * @param onProgress - Progress callback
   * @returns Promise<any> - Upload response
   */
  static async uploadEncryptedFile(
    file: any, 
    apiKey: string, 
    publicKey: string, 
    signedMessage: string,
    onProgress?: (progress: number) => void
  ): Promise<any> {
    try {
      console.log('🔐 Uploading encrypted file to Lighthouse...');
      console.log('📁 File details:', {
        name: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        path: file.path
      });
      
      // Upload with encryption using the signed message directly
      const response = await lighthouse.uploadEncrypted(
        file.path,
        apiKey,
        publicKey,
        signedMessage
      );
      
      console.log('✅ Encrypted file uploaded successfully!');
      console.log('📊 Upload response:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Error uploading encrypted file:', error);
      throw new Error(`Failed to upload encrypted file: ${error.message}`);
    }
  }

  /**
   * Share encrypted file with another user
   * @param cid - Content ID of the encrypted file
   * @param ownerPublicKey - Owner's public key
   * @param buyerPublicKey - Buyer's public key
   * @param signedMessage - Signed message for authentication
   * @returns Promise<any> - Share response
   */
  static async shareEncryptedFile(
    cid: string,
    ownerPublicKey: string,
    buyerPublicKey: string,
    signedMessage: string
  ): Promise<any> {
    try {
      console.log('🤝 Sharing encrypted file...');
      console.log('📁 CID:', cid);
      console.log('👤 Owner:', ownerPublicKey);
      console.log('👤 Buyer:', buyerPublicKey);
      
      // Share the file using the signed message directly
      const response = await lighthouse.shareFile(
        ownerPublicKey,
        [buyerPublicKey],
        cid,
        signedMessage
      );
      
      console.log('✅ File shared successfully!');
      console.log('📊 Share response:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Error sharing file:', error);
      throw new Error(`Failed to share file: ${error.message}`);
    }
  }
}

export default LighthouseService;
