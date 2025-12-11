import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InviteUserDto {
  @ApiProperty({ example: 'john@acme.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiPropertyOptional({ example: ['role-uuid-1'] })
  @IsOptional()
  @IsUUID('4', { each: true })
  roleIds?: string[];

  @ApiPropertyOptional({ example: 'Sales Manager' })
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @ApiPropertyOptional({ example: 'Sales' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ example: 'Custom message for the invite email' })
  @IsOptional()
  @IsString()
  customMessage?: string;
}