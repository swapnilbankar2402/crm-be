import { IsEmail, IsNotEmpty, IsString, MinLength, Matches, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'Acme Corp', description: 'Organization name' })
  @IsNotEmpty()
  @IsString()
  tenantName: string;

  @ApiProperty({ example: 'acme', description: 'Unique tenant slug' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug can only contain lowercase letters, numbers, and hyphens',
  })
  tenantSlug: string;

  @ApiProperty({ example: 'John', description: 'First name' })
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'Last name' })
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiProperty({ example: 'john@acme.com', description: 'Email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongP@ss123', description: 'Password (min 8 characters)' })
  @IsNotEmpty()
  @MinLength(8)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password must contain uppercase, lowercase, and number/special character',
  })
  password: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsOptional()
  @IsString()
  phone?: string;
}