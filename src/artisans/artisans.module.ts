import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ArtisansController } from './artisans.controller';
import { ArtisansService } from './artisans.service';
import { Artisan, ArtisanSchema } from './schemas/artisan.schema';
import { CategoriesModule } from 'src/category/category.module';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Artisan.name, schema: ArtisanSchema }]),
    CategoriesModule,
    UsersModule,
  ],
  controllers: [ArtisansController],
  providers: [ArtisansService, CloudinaryService],
  exports: [ArtisansService, MongooseModule],
})
export class ArtisansModule {}
