import { IsArray, IsEmail, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

class CustomerDto {
  @IsString()
  name!: string

  @IsEmail()
  email!: string

  @IsString()
  cep!: string
}

class ItemDto {
  @IsString()
  sku!: string;

  @IsNumber()
  qty!: number;

  @IsNumber()
  unit_price!: number;
}

export class CreateOrderDto {
  @ValidateNested()
  @Type(() => CustomerDto)
  customer!: CustomerDto

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  items!: ItemDto[]

  @IsString()
  currency!: string;

  @IsNumber()
  @IsOptional()
  totalAmount?: number;

  @IsNumber()
  @IsOptional()
  convertedAmount?: number;

  @IsString()
  @IsOptional()
  convertedCurrency?: string;

  @IsString()
  @IsOptional()
  failureReason?: string;
}