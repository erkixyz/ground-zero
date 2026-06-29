import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Public } from "./auth/decorators/roles.decorator";

@ApiTags('health')
@Controller("hello")
export class AppController {
  @Public()
  @ApiOperation({ summary: "Health check", description: "Returns server status and timestamp." })
  @ApiResponse({ status: 200, description: "Server is running" })
  @Get()
  hello() {
    return {
      message: "Tere! API töötab.",
      timestamp: new Date().toISOString(),
      status: "ok",
    };
  }
}
