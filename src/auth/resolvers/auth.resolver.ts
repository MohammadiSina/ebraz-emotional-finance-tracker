import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AuthService } from '../services/auth.service';
import { RegisterInput } from '../dto/register.input';
import { AuthPayload } from '../dto/auth-payload.output';
import { LoginInput } from '../dto/login.input';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => AuthPayload)
  async register(@Args('registerInput') registerInput: RegisterInput): Promise<AuthPayload> {
    return await this.authService.register(registerInput);
  }

  @Mutation(() => AuthPayload)
  async login(@Args('loginInput') loginInput: LoginInput) {
    return await this.authService.login(loginInput);
  }
}
