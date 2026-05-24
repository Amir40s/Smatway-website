import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string) {
    try {
      const user = await this.authService.validateLocalUser(email, password);
      if (!user) throw new UnauthorizedException('Invalid credentials');
      return user;
    } catch (err) {
      // Re-throw UnauthorizedException as-is (e.g. EMAIL_NOT_VERIFIED)
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('Invalid credentials');
    }
  }
}
