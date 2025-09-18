import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
    @Get()
    healthCheck() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
        };
    }
}
