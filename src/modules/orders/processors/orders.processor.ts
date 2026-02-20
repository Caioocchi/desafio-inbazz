import {
  InjectQueue,
  OnWorkerEvent,
  Processor,
  WorkerHost,
} from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Job, Queue } from 'bullmq';
import { Order } from '../entities/orders.entity';
import { Repository } from 'typeorm';
import { OrderStatus } from 'src/common/enums/order-status.enum';

@Processor('orders-queue')
export class OrdersProcessor extends WorkerHost {
  constructor(
    @InjectRepository(Order)
    private readonly repository: Repository<Order>,

    @InjectQueue('orders-dlq')
    private readonly dlqQueue: Queue,
  ) {
    super();
  }
  async process(job: Job<{ orderId: string }>) {
    const order = await this.repository.findOne({
      where: { order_id: job.data.orderId },
    });

    if (!order) return;

    // if (job.attemptsMade <= 3) {
    //   console.log('Entrou');
    //   throw new Error('Falha ao fazer o pedido.');
    // }

    order.status = OrderStatus.PROCESSING;
    await this.repository.save(order);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    order.status = OrderStatus.COMPLETED;
    await this.repository.save(order);
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<{ orderId: string }>) {
    if (job.attemptsMade >= (job.opts.attempts ?? 1)) {
      await this.dlqQueue.add('dead-order', {
        originalJobId: job.id,
        orderId: job.data.orderId,
        failedReason: job.failedReason,
      });

      const order = await this.repository.findOne({
        where: { order_id: job.data.orderId },
      });

      if (order) {
        order.status = OrderStatus.FAILED_ENRICHMENT;
        await this.repository.save(order);
      }
    }
  }
}
