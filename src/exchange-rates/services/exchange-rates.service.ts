import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ExchangeRate } from 'generated/prisma';
import { catchError, firstValueFrom } from 'rxjs';
import { PrismaService } from '../../common/services/prisma.service';
import { EXCHANGE_RATES_CONSTANT } from '../constants/exchange-rates.constant';
import { BitpinMarketResponse } from '../types/bitpin-market-response.type';

@Injectable()
export class ExchangeRatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
  ) {}

  async findOneCurrencyPair(currencyPair: string): Promise<ExchangeRate | Error> {
    const pair = await this.prisma.exchangeRate.findUnique({ where: { currency: currencyPair } });

    if (!pair) return new NotFoundException(EXCHANGE_RATES_CONSTANT.ERROR.EXCHANGE_RATE_NOT_FOUND(currencyPair));

    return pair;
  }

  async getUsdIrtExchangeRate(): Promise<number> {
    const cacheTime = EXCHANGE_RATES_CONSTANT.CACHE.INTERNAL_EXCHANGE_RATE_EXPIRE_TIME;

    // If the exchange rate is found and is still fresh, return it
    const pair = await this.findOneCurrencyPair('USDIRT');
    if (!(pair instanceof Error) && pair.updatedAt.getTime() + cacheTime > Date.now()) return pair.rate;

    // Otherwise, get the exchange rate from the API and update the database
    const marketExchangeRates = await this.getExchangeRateFromApi();
    const usdIrtExchangeRate = marketExchangeRates.find((rate) => rate.symbol === 'USDT_IRT');

    if (!usdIrtExchangeRate)
      throw new NotFoundException(EXCHANGE_RATES_CONSTANT.ERROR.EXCHANGE_RATE_NOT_FOUND('USDIRT'));

    await this.update('USDIRT', Number(usdIrtExchangeRate.price));

    return Number(usdIrtExchangeRate.price);
  }

  async getExchangeRateFromApi(): Promise<BitpinMarketResponse> {
    const url = EXCHANGE_RATES_CONSTANT.API.BITPIN_MARKET_PRICE_URL;

    const { data } = await firstValueFrom(
      this.httpService.get<BitpinMarketResponse>(url).pipe(
        catchError((err) => {
          throw new BadRequestException(err.response.data);
        }),
      ),
    );

    return data;
  }

  async update(currencyPair: string, rate: number) {
    await this.prisma.exchangeRate.upsert({
      where: { currency: currencyPair },
      update: { rate },
      create: { currency: currencyPair, rate },
    });
  }
}
