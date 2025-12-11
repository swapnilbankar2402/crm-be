import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { User } from '../../common/entities/user.entity';

export interface JwtPayload {
  sub: string; // user id
  email: string;
  tenantId: string;
  roles: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
      relations: ['tenant'],
    });

    // if (!user || !user.isActive) {
    if (!user) {
      throw new UnauthorizedException('User not found or inactive');
    }

    if (user.tenant && !user.tenant.isActive) {
      throw new UnauthorizedException('Tenant is inactive');
    }

    return {
      userId: user.id,
      email: user.email,
      tenantId: user.tenantId,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: payload.roles,
    };
  }
}