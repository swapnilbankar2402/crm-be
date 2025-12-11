import { IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignPermissionsDto {
  @ApiProperty({
    example: ['leads:create', 'leads:read', 'contacts:*'],
    description: 'Array of permission strings to assign',
  })
  @IsArray()
  @IsString({ each: true })
  permissions: string[];
}