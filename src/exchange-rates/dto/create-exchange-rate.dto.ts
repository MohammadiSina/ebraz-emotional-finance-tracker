import { IsNumber, Length } from 'class-validator';
import { EXCHANGE_RATES_CONSTANT } from '../constants/exchange-rates.constant';

export class CreateExchangeRateDto {
  @Length(EXCHANGE_RATES_CONSTANT.LENGTH.CURRENCY_PAIR.MIN, EXCHANGE_RATES_CONSTANT.LENGTH.CURRENCY_PAIR.MAX)
  currency: string;

  @IsNumber({ allowInfinity: false, allowNaN: false })
  rate: number;
}
