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
    @InjectModel(User.name) private userModel: Model<UserDocument>,
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
    
    const user = await this.userModel.findById(payload.sub).select('-password');
    
    if (!user) {
      console.error('❌ User not found for ID:', payload.sub);
      throw new Error('User not found'); 
    }

    // ✅ FIX: Return full user object with _id property
    return user.toObject(); 
  }
}