import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from "@nestjs/swagger";
import { SearchService } from "./search.service";
import { Public } from "../auth/decorators/roles.decorator";

@ApiTags("search")
@Controller("search")
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Public()
  @ApiOperation({ summary: "Global search across notes and users" })
  @ApiQuery({ name: "q", type: String, description: "Search query" })
  @ApiResponse({ status: 200, description: "Search results grouped by notes and users" })
  @Get()
  search(@Query("q") q = "") {
    return this.searchService.search(q);
  }
}
