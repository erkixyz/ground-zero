import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

@ApiTags('health')
@Controller("hello")
export class AppController {
  @ApiOperation({ summary: 'Health check', description: 'Returns server status and timestamp.' })
  @ApiResponse({ status: 200, description: 'Server is running', schema: { example: { message: 'Hello World!', timestamp: '2024-01-01T00:00:00.000Z', status: 'ok' } } })
  @Get()
  hello() {
    return {
      message: "Tere! API töötab.",
      timestamp: new Date().toISOString(),
      status: "ok",
    };
  }
}
