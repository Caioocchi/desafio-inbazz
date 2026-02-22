import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateOrderDto } from '../dto/orders.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from '../entities/orders.entity';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ViaCepService } from 'src/common/viacep/viacep.service';
import { OrderStatus } from 'src/common/enums/order-status.enum';
import { FilterOrdersDto } from '../dto/filter-orders.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly repository: Repository<Order>,

    @InjectQueue('orders-queue')
    private readonly ordersQueue: Queue,

    @InjectQueue('orders-dlq')
    private readonly dlqQueue: Queue,

    private readonly viaCepService: ViaCepService
  ) {}

  async receiveOrder(dto: CreateOrderDto) {
    const cep = await this.viaCepService.validateCep(dto.customer.cep);

    const enrichedCustomer = {
      name: dto.customer.name,
      email: dto.customer.email,
      cep: cep.cep,
      logradouro: cep.logradouro,
      complemento: cep.complemento,
      bairro: cep.bairro,
      localidade: cep.localidade,
      uf: cep.uf,
      estado: cep.estado,

    };

    const order = this.repository.create({
      ...dto,
      customer: enrichedCustomer,
      status: OrderStatus.RECEIVED,
    });
    const saved = await this.repository.save(order)

    await this.ordersQueue.add('process-order', {
      orderId: saved.order_id,
    })

    return saved;
  }

  async getOrders(filter: FilterOrdersDto) {
    const where: any = {};
    let orders: Array<CreateOrderDto> = []
    let count = 0
    
    if (filter.status) {
      where.status = filter.status;
    }

    orders = await this.repository.find({ where })
    count = orders.length

    if ((orders).length === 0 ) {
      throw new NotFoundException('Nenhum registro encontrado') 
    }

    return {count: count, orders: orders};
  }

  getOrderById(order_id: string) {
    return this.repository.findOneBy({ order_id });
  }

  async getQueueInfo() {
    const waiting = await this.ordersQueue.getWaitingCount();
    const active = await this.ordersQueue.getActiveCount();
    const completed = await this.ordersQueue.getCompletedCount();
    const failed = await this.ordersQueue.getFailedCount();
    const delayed = await this.ordersQueue.getDelayedCount();

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
    };
  }

  async getDlqJobs() {
  const jobs = await this.dlqQueue.getJobs([
    'waiting',
    'active',
    'failed',
    'completed',
  ]);

  return jobs.map(job => ({
    id: job.id,
    orderId: job.data.orderId,
    failedReason: job.data.failedReason,
    attemptsMade: job.attemptsMade,
    timestamp: job.timestamp,
  }));
}
}
