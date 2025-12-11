import { IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignRoleToUsersDto {
  @ApiProperty({
    example: ['user-uuid-1', 'user-uuid-2'],
    description: 'Array of user IDs',
  })
  @IsArray()
  @IsUUID('4', { each: true })
  userIds: string[];
}