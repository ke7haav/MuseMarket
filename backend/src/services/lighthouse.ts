import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { config } from '@/config';
import { FilecoinUpload, LighthouseResponse } from '@/types';

class LighthouseService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = config.lighthouseApiKey;
    this.baseUrl = 'https://api.lighthouse.storage/api';
  }

  /**
   * Upload file to Filecoin via Lighthouse
   */
  async uploadFile(filePath: string, fileName: string): Promise<FilecoinUpload> {
    try {
      if (!this.apiKey) {
        throw new Error('Lighthouse API key not configured');
      }

      const formData = new FormData();
      formData.append('file', fs.createReadStream(filePath));
      formData.append('fileName', fileName);

      const response = await axios.post<LighthouseResponse>(
        `${this.baseUrl}/v0/add`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'Authorization': `Bearer ${this.apiKey}`,
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        }
      );

      const { Hash: cid, Size: size } = response.data.data;
      const url = `${config.ipfsGatewayUrl}${cid}`;

      return {
        cid,
        size: parseInt(size),
        url,
        gateway: config.ipfsGatewayUrl
      };
    } catch (error) {
      console.error('Lighthouse upload error:', error);
      throw new Error('Failed to upload file to Filecoin');
    }
  }

  /**
   * Upload file buffer to Filecoin via Lighthouse
   */
  async uploadBuffer(buffer: Buffer, fileName: string): Promise<FilecoinUpload> {
    try {
      if (!this.apiKey) {
        throw new Error('Lighthouse API key not configured');
      }

      const formData = new FormData();
      formData.append('file', buffer, { filename: fileName });
      formData.append('fileName', fileName);

      const response = await axios.post<LighthouseResponse>(
        `${this.baseUrl}/v0/add`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'Authorization': `Bearer ${this.apiKey}`,
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        }
      );

      const { Hash: cid, Size: size } = response.data.data;
      const url = `${config.ipfsGatewayUrl}${cid}`;

      return {
        cid,
        size: parseInt(size),
        url,
        gateway: config.ipfsGatewayUrl
      };
    } catch (error) {
      console.error('Lighthouse upload error:', error);
      throw new Error('Failed to upload file to Filecoin');
    }
  }

  /**
   * Get file info from CID
   */
  async getFileInfo(cid: string): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/v0/stat?arg=${cid}`);
      return response.data;
    } catch (error) {
      console.error('Lighthouse get file info error:', error);
      throw new Error('Failed to get file info');
    }
  }

  /**
   * Pin file to ensure persistence
   */
  async pinFile(cid: string): Promise<boolean> {
    try {
      if (!this.apiKey) {
        throw new Error('Lighthouse API key not configured');
      }

      await axios.post(
        `${this.baseUrl}/v0/pin/add?arg=${cid}`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );

      return true;
    } catch (error) {
      console.error('Lighthouse pin error:', error);
      return false;
    }
  }

  /**
   * Get upload progress (if supported)
   */
  async getUploadProgress(uploadId: string): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/v0/upload/progress/${uploadId}`);
      return response.data;
    } catch (error) {
      console.error('Lighthouse progress error:', error);
      return null;
    }
  }

  /**
   * Verify file is accessible via IPFS
   */
  async verifyFileAccess(cid: string): Promise<boolean> {
    try {
      const url = `${config.ipfsGatewayUrl}${cid}`;
      const response = await axios.head(url, { timeout: 10000 });
      return response.status === 200;
    } catch (error) {
      console.error('File access verification error:', error);
      return false;
    }
  }
}

export default new LighthouseService();
