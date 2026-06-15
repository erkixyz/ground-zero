import { Controller, Get } from "@nestjs/common";

@Controller("hello")
export class AppController {
  @Get()
  hello() {
    return {
      message: "Tere! API töötab.",
      timestamp: new Date().toISOString(),
      status: "ok",
    };
  }
}
