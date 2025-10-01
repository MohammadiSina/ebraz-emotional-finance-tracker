import { BadRequestException, GatewayTimeoutException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { catchError, firstValueFrom } from 'rxjs';
import { ExchangeRate } from 'generated/prisma';

import { PrismaService } from '../../common/services/prisma.service';
import { EXCHANGE_RATES_CONSTANT } from '../constants/exchange-rates.constant';
import { BitpinMarketResponse } from '../types/bitpin-market-response.type';

@Injectable()
export class ExchangeRatesService {
  private readonly cacheTtl: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    this.cacheTtl = Number(this.configService.get<string>('REDIS_CACHE_TTL')) || 1800000;
  }

  private getCacheKey(currencyPair: string): string {
    return `${EXCHANGE_RATES_CONSTANT.CACHE_KEY_PREFIX}${currencyPair.toLowerCase()}`;
  }

  private async findOneCurrencyPair(currencyPair: string): Promise<ExchangeRate | null> {
    const cacheKey = this.getCacheKey(currencyPair);

    // If the exchange rate is found in the cache, return it
    const cachedRate = await this.cacheManager.get<ExchangeRate>(cacheKey);
    if (cachedRate) return cachedRate;

    // Otherwise, get the exchange rate from the database
    const pair = await this.prisma.exchangeRate.findUnique({ where: { currency: currencyPair } });

    return !pair || pair.updatedAt.getTime() + this.cacheTtl < Date.now() ? null : pair;
  }

  async getUsdIrtExchangeRate(): Promise<number> {
    // If the exchange rate is found and is still fresh, return it
    const pair = await this.findOneCurrencyPair(EXCHANGE_RATES_CONSTANT.CURRENCY_PAIRS.USD_IRT);
    if (pair) return pair.rate;

    // Otherwise, get the exchange rate from the API and update the database
    const marketExchangeRates = await this.getExchangeRateFromApi();
    const usdIrtExchangeRate = marketExchangeRates.find(
      (rate) => rate.symbol === EXCHANGE_RATES_CONSTANT.API.BITPIN_USDT_IRT_SYMBOL,
    );

    if (!usdIrtExchangeRate)
      throw new GatewayTimeoutException(EXCHANGE_RATES_CONSTANT.ERROR.EXCHANGE_RATE_NOT_RETRIEVED);

    const rate = Number(usdIrtExchangeRate.price);
    await this.update(EXCHANGE_RATES_CONSTANT.CURRENCY_PAIRS.USD_IRT, rate);

    return rate;
  }

  async getExchangeRateFromApi(): Promise<BitpinMarketResponse> {
    const url = EXCHANGE_RATES_CONSTANT.API.BITPIN_MARKET_PRICE_URL;

    const { data } = await firstValueFrom(
      this.httpService.get<BitpinMarketResponse>(url).pipe(
        catchError((err) => {
          throw new BadRequestException(err.response?.data || EXCHANGE_RATES_CONSTANT.ERROR.API_REQUEST_FAILED);
        }),
      ),
    );

    return data;
  }

  private async update(currencyPair: string, rate: number): Promise<void> {
    if (!currencyPair) throw new BadRequestException(EXCHANGE_RATES_CONSTANT.ERROR.CURRENCY_PAIR_EMPTY);
    if (typeof rate !== 'number' || rate <= 0)
      throw new BadRequestException(EXCHANGE_RATES_CONSTANT.ERROR.RATE_NOT_POSITIVE);

    const cacheKey = this.getCacheKey(currencyPair);

    // Update database
    const updatedRate = await this.prisma.exchangeRate.upsert({
      where: { currency: currencyPair },
      update: { rate },
      create: { currency: currencyPair, rate },
    });

    // Update cache
    await this.cacheManager.set(cacheKey, updatedRate, this.cacheTtl);
  }
}
