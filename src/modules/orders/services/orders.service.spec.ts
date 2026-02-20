import { Repository } from 'typeorm';
import { OrdersService } from './orders.service';
import { Order } from '../entities/orders.entity';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { beforeEach, describe, it } from 'node:test';
import { OrderStatus } from 'src/common/enums/order-status.enum';

describe('OrdersService', () => {
  let service: OrdersService;
  let repository: jest.Mocked<Repository<Order>>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: getRepositoryToken(Order),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    repository = module.get(getRepositoryToken(Order));
  });

  it('should update order status to processing', async () => {
    const orderMock = {
      order_id: '1',
      status: OrderStatus.RECEIVED,
    } as Order;

    repository.findOne.mockResolvedValue(orderMock);

    await service.receiveOrder(orderMock);

    expect(repository.save).toHaveBeenCalled();
  });
});
