import { IsEnum, IsOptional } from "class-validator";
import { OrderStatus } from "src/common/enums/order-status.enum";

export class FilterOrdersDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}