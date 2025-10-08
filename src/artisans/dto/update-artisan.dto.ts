import { PartialType } from '@nestjs/mapped-types';
import { CreateArtisanDto } from './create-artisan.dto';

export class UpdateArtisanDto extends PartialType(CreateArtisanDto) {}
