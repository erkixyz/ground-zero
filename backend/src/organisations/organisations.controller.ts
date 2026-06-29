import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from "@nestjs/swagger";
import { OrganisationsService } from "./organisations.service";
import { CreateOrganisationDto } from "./dto/create-organisation.dto";
import { UpdateOrganisationDto } from "./dto/update-organisation.dto";

@ApiTags("organisations")
@Controller("organisations")
export class OrganisationsController {
  constructor(private readonly organisationsService: OrganisationsService) {}

  @ApiOperation({ summary: "List all organisations" })
  @ApiResponse({ status: 200 })
  @Get()
  findAll() {
    return this.organisationsService.findAll();
  }

  @ApiOperation({ summary: "Search organisations by name or reg code" })
  @ApiQuery({ name: "q", type: String })
  @ApiResponse({ status: 200 })
  @Get("search")
  search(@Query("q") q: string) {
    return this.organisationsService.search(q ?? "");
  }

  @ApiOperation({ summary: "Get organisation by id" })
  @ApiParam({ name: "id", type: String })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: "Organisation not found" })
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.organisationsService.findOne(id);
  }

  @ApiOperation({ summary: "Create organisation" })
  @ApiResponse({ status: 201 })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateOrganisationDto) {
    return this.organisationsService.create({
      name: dto.name,
      regCode: dto.regCode,
      street: dto.street,
      city: dto.city,
      zip: dto.zip,
      country: dto.country,
    });
  }

  @ApiOperation({ summary: "Update organisation" })
  @ApiParam({ name: "id", type: String })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: "Organisation not found" })
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateOrganisationDto) {
    return this.organisationsService.update(id, {
      name: dto.name,
      regCode: dto.regCode,
      street: dto.street,
      city: dto.city,
      zip: dto.zip,
      country: dto.country,
    });
  }

  @ApiOperation({ summary: "Delete organisation" })
  @ApiParam({ name: "id", type: String })
  @ApiResponse({ status: 204 })
  @ApiResponse({ status: 404, description: "Organisation not found" })
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id") id: string) {
    return this.organisationsService.remove(id);
  }
}
