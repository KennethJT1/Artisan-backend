import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseInterceptors,
  UploadedFiles,
  Query,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ArtisansService } from './artisans.service';
import { Artisan } from './schemas/artisan.schema';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { PaginatedResult } from 'src/common/interfaces/paginated-result.interface';

@Controller('artisans')
export class ArtisansController {
  constructor(
    private readonly artisansService: ArtisansService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // ✅ FIXED: Added @Post('apply') and FileFieldsInterceptor
  @Post('apply')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'portfolio', maxCount: 5 },
      { name: 'certifications', maxCount: 5 },
    ]),
  )
  async apply(
    @UploadedFiles()
    files: {
      portfolio?: Express.Multer.File[];
      certifications?: Express.Multer.File[];
    },
    @Body()
    createArtisanData: Omit<Partial<Artisan>, 'portfolio' | 'certifications'>,
  ) {
    const portfolioUrls: string[] = [];
    const certificationUrls: string[] = [];
    const safeFiles = files || {};

    if (safeFiles.portfolio?.length) {
      const uploaded = await Promise.all(
        safeFiles.portfolio.map(async (file) => {
          const result = await this.cloudinaryService.uploadFile(
            file.buffer,
            'artisans/portfolio',
            file.mimetype,
          );
          return result.secure_url;
        }),
      );
      portfolioUrls.push(...uploaded);
    }

    if (safeFiles.certifications?.length) {
      const uploaded = await Promise.all(
        safeFiles.certifications.map(async (file) => {
          const folder = file.mimetype.startsWith('image/')
            ? 'artisans/certifications'
            : 'artisans/certifications_docs';
          const result = await this.cloudinaryService.uploadFile(
            file.buffer,
            folder,
            file.mimetype,
          );
          return result.secure_url;
        }),
      );
      certificationUrls.push(...uploaded);
    }

    const artisanDataWithUrls = {
      ...createArtisanData,
      portfolio: portfolioUrls,
      certifications: certificationUrls,
    };

    return this.artisansService.apply(artisanDataWithUrls);
  }

  @Get('pending')
  async findPending(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ): Promise<PaginatedResult<Artisan>> {
    return this.artisansService.findPending(page, limit);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.artisansService.updateStatus(id, status);
  }

  @Get()
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ): Promise<PaginatedResult<Artisan>> {
    return this.artisansService.findAll(page, limit);
  }
}
