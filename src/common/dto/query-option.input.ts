import { Field, InputType } from '@nestjs/graphql';
import { IsInt, IsOptional } from 'class-validator';
import { COMMON_CONSTANT } from '../constants/common.constant';

@InputType()
export class QueryOptionInput {
  @IsInt()
  @IsOptional()
  @Field({ nullable: true, description: COMMON_CONSTANT.FIELD_DESCRIPTION.PAGE })
  page?: number;

  @IsInt()
  @IsOptional()
  @Field({ nullable: true, description: COMMON_CONSTANT.FIELD_DESCRIPTION.TAKE })
  take?: number;
}
