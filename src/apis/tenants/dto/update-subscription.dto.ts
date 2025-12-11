import { IsEnum, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubscriptionPlan } from 'src/common/entities';

export class UpdateSubscriptionDto {
  @ApiProperty({ enum: SubscriptionPlan })
  @IsEnum(SubscriptionPlan)
  plan: SubscriptionPlan;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  subscriptionEndsAt?: string;
}