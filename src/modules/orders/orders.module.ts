import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Order } from "./entities/orders.entity";
import { OrdersController } from "./controllers/orders.controller";
import { OrdersService } from "./services/orders.service";
import { OrdersProcessor } from "./processors/orders.processor";
import { ViaCepModule } from "src/common/viacep/viacep.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([Order]),
        BullModule.registerQueue(
            { name: 'orders-queue' },
            { name: 'orders-dlq' }
        ),
        ViaCepModule
    ],
    controllers: [OrdersController],
    providers: [OrdersService, OrdersProcessor],
})
export class OrdersModule {}