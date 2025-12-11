import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'john@acme.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongP@ss123' })
  @IsNotEmpty()
  @IsString()
  password: string;
}