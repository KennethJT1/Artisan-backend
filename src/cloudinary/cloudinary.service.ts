import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cloudinary from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor(private readonly configService: ConfigService) {
    cloudinary.v2.config({
      cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadFile(
    fileBuffer: Buffer,
    folder: string, // e.g., 'artisans/portfolio', 'artisans/certifications'
    mimeType: string, // e.g., 'image/jpeg', 'application/pdf'
    publicId?: string // Optional: specify a public ID for the resource
  ): Promise<cloudinary.UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const resourceType = mimeType.startsWith('image/') ? 'image' : 'raw'; // 'raw' for non-images like PDFs
      const uploadStream = cloudinary.v2.uploader.upload_stream(
        { resource_type: resourceType, folder, public_id: publicId },
        (error, result) => {
          if (error) {
            console.error('Cloudinary Upload Error:', error);
            reject(error);
          } else {
            resolve(result as cloudinary.UploadApiResponse);
          }
        }
      );
      uploadStream.end(fileBuffer);
    });
  }
}