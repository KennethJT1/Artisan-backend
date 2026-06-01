export class CreateArtisanDto {}

export interface ApplyArtisanDto {
  firstName: string;
  lastName: string;
  email: string;
  password?: string; // optional
  phone?: string;
  location: string;
  category: string; // frontend sends category name
  experience: string;
  hourlyRate: number;
  description: string;
  portfolio?: string[];
  certifications?: string[];
  // Aliases accepted from JSON body
  portfolioUrls?: string[];
  certificationUrls?: string[];
  agreeToTerms?: boolean;
}
