import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  health() {
    return {
      status: 'ok',
      message: 'Application is running',
      timestamp: new Date().toISOString(),
    };
  }
}
