import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { USER_CONSTANT, UserRole } from '../../users/constants/users.constant';
import { UsersService } from '../../users/services/users.service';
import { AUTH_CONSTANT } from '../constants/auth.constant';
import { LoginInput } from '../dto/login.input';
import { RegisterInput } from '../dto/register.input';
import { HashService } from './hash.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly hashService: HashService,
  ) {}

  async register(registerInput: RegisterInput) {
    if (await this.usersService.userExists(registerInput.email))
      throw new ConflictException(USER_CONSTANT.ERROR.DUPLICATE_EMAIL);

    const hashedPassword = await this.hashService.hashPassword(registerInput.password);
    const user = await this.usersService.create({ ...registerInput, password: hashedPassword, role: UserRole.USER });

    return {
      accessToken: await this.jwtService.signAsync({ sub: user.id }),
      user,
    };
  }

  async login({ email, password }: LoginInput) {
    const validatedUser = await this.validateUser(email, password);

    if (!validatedUser) throw new UnauthorizedException(AUTH_CONSTANT.ERROR.UNAUTHORIZED_CREDENTIALS);

    const { password: _, ...user } = validatedUser;

    return {
      accessToken: await this.jwtService.signAsync({ sub: validatedUser.id }),
      user,
    };
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) return null;

    return (await this.hashService.comparePasswords(password, user.password)) ? user : null;
  }
}
