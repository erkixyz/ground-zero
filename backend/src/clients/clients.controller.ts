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
import { ClientsService } from "./clients.service";
import { CreateClientDto } from "./dto/create-client.dto";
import { UpdateClientDto } from "./dto/update-client.dto";

@ApiTags("clients")
@Controller("clients")
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @ApiOperation({ summary: "List all clients" })
  @ApiResponse({ status: 200 })
  @Get()
  findAll() {
    return this.clientsService.findAll();
  }

  @ApiOperation({ summary: "Search clients by name or reg code" })
  @ApiQuery({ name: "q", type: String })
  @ApiResponse({ status: 200 })
  @Get("search")
  search(@Query("q") q: string) {
    return this.clientsService.search(q ?? "");
  }

  @ApiOperation({ summary: "Get client by id" })
  @ApiParam({ name: "id", type: String })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: "Client not found" })
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.clientsService.findOne(id);
  }

  @ApiOperation({ summary: "Create client" })
  @ApiResponse({ status: 201 })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateClientDto) {
    return this.clientsService.create({ name: dto.name, regCode: dto.regCode });
  }

  @ApiOperation({ summary: "Update client" })
  @ApiParam({ name: "id", type: String })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: "Client not found" })
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateClientDto) {
    return this.clientsService.update(id, { name: dto.name, regCode: dto.regCode });
  }

  @ApiOperation({ summary: "Delete client" })
  @ApiParam({ name: "id", type: String })
  @ApiResponse({ status: 204 })
  @ApiResponse({ status: 404, description: "Client not found" })
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id") id: string) {
    return this.clientsService.remove(id);
  }
}
