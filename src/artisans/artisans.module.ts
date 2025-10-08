import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ArtisansController } from './artisans.controller';
import { ArtisansService } from './artisans.service';
import { Artisan, ArtisanSchema } from './schemas/artisan.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Artisan.name, schema: ArtisanSchema }]),
  ],
  controllers: [ArtisansController],
  providers: [ArtisansService],
  exports: [ArtisansService], 
})
export class ArtisansModule {}
