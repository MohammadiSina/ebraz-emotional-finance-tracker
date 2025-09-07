import { Field, InputType } from '@nestjs/graphql';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { COMMON_CONSTANT } from '../constants/common.constant';

@InputType()
export class QueryOptionInput {
  @Min(COMMON_CONSTANT.LENGTH.PAGE.MIN)
  @IsInt()
  @IsOptional()
  @Field({ nullable: true, description: COMMON_CONSTANT.FIELD_DESCRIPTION.PAGE })
  page?: number;

  @Max(COMMON_CONSTANT.LENGTH.TAKE.MAX)
  @Min(COMMON_CONSTANT.LENGTH.TAKE.MIN)
  @IsInt()
  @IsOptional()
  @Field({ nullable: true, description: COMMON_CONSTANT.FIELD_DESCRIPTION.TAKE })
  take?: number;
}
