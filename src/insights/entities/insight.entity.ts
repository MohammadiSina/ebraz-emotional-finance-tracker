import { ObjectType, Field } from '@nestjs/graphql';
import { INSIGHTS_CONSTANT } from '../constants/insights.constant';

@ObjectType()
export class Insight {
  @Field({ description: INSIGHTS_CONSTANT.FIELD_DESCRIPTION.ID })
  id: string;

  @Field({ description: INSIGHTS_CONSTANT.FIELD_DESCRIPTION.USER_ID })
  userId: string;

  @Field({ description: INSIGHTS_CONSTANT.FIELD_DESCRIPTION.PERIOD })
  period: string;

  @Field({ description: INSIGHTS_CONSTANT.FIELD_DESCRIPTION.CONTENT })
  content: string;

  llmModel: string; // Not exposed to the client

  llmRequestId: string; // Not exposed to the client

  @Field({ description: INSIGHTS_CONSTANT.FIELD_DESCRIPTION.CREATED_AT })
  createdAt: Date;

  @Field({ description: INSIGHTS_CONSTANT.FIELD_DESCRIPTION.UPDATED_AT })
  updatedAt: Date;
}
