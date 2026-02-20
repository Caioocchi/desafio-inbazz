import { Body, Controller, Get, NotFoundException, Param, Post, Query } from "@nestjs/common";
import { OrdersService } from "../services/orders.service";
import { CreateOrderDto } from "../dto/orders.dto";
import { FilterOrdersDto } from "../dto/filter-orders.dto";

@Controller('')
export class OrdersController {
constructor(private readonly ordersService: OrdersService) {}

    @Post('webhooks/orders')
    async receiveOrder(@Body() dto: CreateOrderDto) {
        return await this.ordersService.receiveOrder(dto)
    }

    @Get('/orders')
    getOrders(@Query() query: FilterOrdersDto) {
        return this.ordersService.getOrders(query)
    }

    @Get('orders/:id')
    async getOrderById(@Param('id') id: string) {
        console.log(id)
        const developer = await this.ordersService.getOrderById(id);
        if (!developer) throw new NotFoundException();
        return developer;
    }

    @Get('queue/metrics')
    async getQueueInfo() {
        return await this.ordersService.getQueueInfo()
    }

    @Get('queue/dlq')
    async getDlq() {
        return await this.ordersService.getDlqJobs();
    }
}