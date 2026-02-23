import { IsArray, IsNotEmpty, IsEmail, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

class CustomerDto {
  @IsNotEmpty()
  @IsString()
  name!: string

  @IsNotEmpty()
  @IsEmail()
  email!: string

  @IsNotEmpty()
  @IsString()
  cep!: string
}

class ItemDto {
  @IsNotEmpty()
  @IsString()
  sku!: string;

  @IsNotEmpty()
  @IsNumber()
  qty!: number;

  @IsNotEmpty()
  @IsNumber()
  unit_price!: number;
}

export class CreateOrderDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CustomerDto)
  customer!: CustomerDto

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  items!: ItemDto[]

  @IsNotEmpty()
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