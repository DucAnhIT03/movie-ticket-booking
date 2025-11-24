import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  constructor(private readonly config: ConfigService) {
    cloudinary.config({
      cloud_name: this.config.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.config.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.config.get<string>('CLOUDINARY_API_SECRET'),
      secure: true,
    });
  }

  uploadBuffer(buffer: Buffer, folder?: string): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ folder }, (err, res) => {
        if (err) return reject(err);
        resolve(res as UploadApiResponse);
      });
      Readable.from(buffer).pipe(stream);
    });
  }

  async deleteByPublicId(publicId: string): Promise<{ result: string }> {
    const res = await cloudinary.uploader.destroy(publicId);
    return res as unknown as { result: string };
  }

  async deleteManyByPublicIds(publicIds: string[]): Promise<{ success: string[]; failed: { id: string; error: string }[] }> {
    const results = await Promise.allSettled(publicIds.map(id => this.deleteByPublicId(id)));
    const success: string[] = [];
    const failed: { id: string; error: string }[] = [];
    results.forEach((r, idx) => {
      if (r.status === 'fulfilled' && r.value?.result === 'ok') {
        success.push(publicIds[idx]);
      } else if (r.status === 'fulfilled') {
        failed.push({ id: publicIds[idx], error: r.value?.result ?? 'unknown' });
      } else {
        failed.push({ id: publicIds[idx], error: r.reason?.message ?? 'failed' });
      }
    });
    return { success, failed };
  }
}



