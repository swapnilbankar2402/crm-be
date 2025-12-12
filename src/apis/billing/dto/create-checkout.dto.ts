import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCheckoutDto {
  @IsNotEmpty()
  @IsString()
  planSlug: string; // maps to Plan.slug in DB
}