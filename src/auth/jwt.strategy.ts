import { Injectable } from '@nestjs/common';
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
    @InjectModel(User.name) private userModel: Model<UserDocument>, // Inject User model
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');

    if (!jwtSecret) {
      throw new Error('JWT secret is not defined in configuration');
    }

    const options: StrategyOptions = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
      passReqToCallback: false,
    };

    super(options);
  }

  async validate(payload: any) { 
    const user = await this.userModel.findById(payload.sub).select('-password'); // Exclude password
    if (!user) {
      throw new Error('User not found'); 
    }

    return { id: user._id, email: user.email, role: user.role }; 
  }
}