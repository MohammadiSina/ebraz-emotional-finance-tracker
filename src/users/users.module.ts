import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersResolver } from './resolvers/users.resolver';
import { UsersService } from './services/users.service';

@Module({
  imports: [forwardRef(() => AuthModule)],
  providers: [UsersResolver, UsersService],
  exports: [UsersService],
})
export class UsersModule {}
