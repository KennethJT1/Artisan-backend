import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { StrategyOptions } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');

    if (!jwtSecret) {
      throw new Error('JWT secret is not defined in configuration');
    }

    const cookieExtractor = (req: any) => {
      return req?.cookies?.token; // name of cookie
    };

    const options: StrategyOptions = {
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
      passReqToCallback: false,
    };

    super(options);
  }

  // async validate(payload: any) {

  //   const user = await this.userModel.findById(payload.sub).select('-password');

  //   if (!user) {
  //     console.error('❌ User not found for ID:', payload.sub);
  //     throw new Error('User not found');
  //   }

  //   // ✅ FIX: Return full user object with _id property
  //   return user.toObject();
  // }

  async validate(payload: any) {
    const user = await this.userModel.findById(payload.sub).select('-password');

    if (!user) {
      throw new UnauthorizedException(
        'You are not authorized to perform this action.',
      );
    }

    // return user.toObject();
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      userName: user.firstName,
    };
  }
}
