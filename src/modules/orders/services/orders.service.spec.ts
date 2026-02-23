import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { Order } from '../entities/orders.entity';
import { Repository } from 'typeorm';
import { Job, Queue } from 'bullmq';
import { ViaCepService } from 'src/common/viacep/viacep.service';
import { NotFoundException } from '@nestjs/common';
import { CreateOrderDto } from '../dto/orders.dto';
import { OrderStatus } from 'src/common/enums/order-status.enum';

describe('OrdersService', () => {
  let service: OrdersService;
  let repository: jest.Mocked<Repository<Order>>;
  let ordersQueue: jest.Mocked<Queue>;
  let dlqQueue: jest.Mocked<Queue>;
  let viaCepService: jest.Mocked<ViaCepService>;

  const repositoryMock = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOneBy: jest.fn(),
  };

  const queueMock = {
    add: jest.fn(),
    getWaitingCount: jest.fn(),
    getActiveCount: jest.fn(),
    getCompletedCount: jest.fn(),
    getFailedCount: jest.fn(),
    getDelayedCount: jest.fn(),
    getJobs: jest.fn(),
  };

  const viaCepMock = {
    validateCep: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: getRepositoryToken(Order),
          useValue: repositoryMock,
        },
        {
          provide: 'BullQueue_orders-queue',
          useValue: queueMock,
        },
        {
          provide: 'BullQueue_orders-dlq',
          useValue: queueMock,
        },
        {
          provide: ViaCepService,
          useValue: viaCepMock,
        },
      ],
    }).compile();

    service = module.get(OrdersService);
    repository = module.get(getRepositoryToken(Order));
    ordersQueue = module.get('BullQueue_orders-queue');
    dlqQueue = module.get('BullQueue_orders-dlq');
    viaCepService = module.get(ViaCepService);

    jest.clearAllMocks();
  });

  describe('receiveOrder', () => {
    it('should enrich customer, save order and add job to queue', async () => {
      const dto: CreateOrderDto = {
        customer: {
          name: 'Caio',
          email: 'caio@inbazz.com',
          cep: '29102035',
        },
        items: [
          {
            sku: 'abc123',
            qty: 1,
            unit_price: 100,
          },
        ],
        currency: 'BRL',
      };

      const cepResponse = {
        cep: '29102035',
        logradouro: 'Avenida Saturnino Rangel Mauro',
        complemento: '',
        bairro: 'Praia de Itaparica',
        unidade: '',
        localidade: 'Vila Velha',
        uf: 'ES',
        estado: 'Espírito Santo',
      };

      const savedOrder = {
        order_id: '123',
        idempotency_key: '123',
        ...dto,
        customer: {
          ...dto.customer,
          ...cepResponse,
        },
        status: OrderStatus.RECEIVED,
      };

      const mockJob = {
        id: '1',
        name: 'process-order',
        data: { order_id: 'order-123' },
        attemptsMade: 0,
        timestamp: Date.now(),
      } as unknown as Job;

      viaCepService.validateCep.mockResolvedValue(cepResponse);
      repository.create.mockReturnValue(savedOrder);
      repository.save.mockResolvedValue(savedOrder);
      ordersQueue.add.mockResolvedValue(mockJob);

      const result = await service.receiveOrder(dto);

      expect(viaCepService.validateCep).toHaveBeenCalledWith('29102035');

      expect(repository.create).toHaveBeenCalledWith({
        ...dto,
        customer: {
          name: dto.customer.name,
          email: dto.customer.email,
          cep: dto.customer.cep,
          logradouro: cepResponse.logradouro,
          complemento: cepResponse.complemento,
          bairro: cepResponse.bairro,
          localidade: cepResponse.localidade,
          uf: cepResponse.uf,
          estado: cepResponse.estado,
        },
        status: OrderStatus.RECEIVED,
      });

      expect(repository.save).toHaveBeenCalledWith(savedOrder);

      expect(ordersQueue.add).toHaveBeenCalledWith('process-order', {
        orderId: savedOrder.order_id,
      });

      expect(result).toEqual(savedOrder);
    });
  });

  describe('getOrders', () => {
    it('should return orders and count', async () => {
      const orders = [
        {
          count: '1',
          orders: [
            {
              order_id: 'dedf7291-14aa-4cf9-8a81-dc2850922c35',
              idempotency_key: '9dafeeec-c9fb-49d3-aea4-5338fa1ef3c8',
              customer: {
                uf: 'ES',
                cep: '29102-035',
                name: 'Caio',
                email: 'caio@inbazz.com',
                bairro: 'Praia de Itaparica',
                estado: 'Espírito Santo',
                localidade: 'Vila Velha',
                logradouro: 'Avenida Saturnino Rangel Mauro',
                complemento: 'de 021 a 777 - lado ímpar',
              },
              status: 'COMPLETED',
              items: [
                {
                  qty: 5,
                  sku: 'DEF456',
                  unit_price: 109.9,
                },
              ],
              currency: 'BRL',
              totalAmount: null,
              convertedAmount: null,
              convertedCurrency: null,
              failureReason: null,
            },
          ],
        },
      ] as any;

      repository.find.mockResolvedValue(orders);

      const result = await service.getOrders({} as any);

      expect(result).toEqual({
        count: 1,
        orders,
      });
    });

    it('should throw NotFoundException when empty', async () => {
      repository.find.mockResolvedValue([]);

      await expect(service.getOrders({} as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getOrderById', () => {
    it('should call repository.findOneBy', async () => {
      const order = { order_id: '1' } as Order;

      repository.findOneBy.mockResolvedValue(order);

      const result = await service.getOrderById('1');

      expect(repository.findOneBy).toHaveBeenCalledWith({
        order_id: '1',
      });
      expect(result).toEqual(order);
    });
  });

  describe('getQueueInfo', () => {
    it('should return queue metrics', async () => {
      ordersQueue.getWaitingCount.mockResolvedValue(1);
      ordersQueue.getActiveCount.mockResolvedValue(2);
      ordersQueue.getCompletedCount.mockResolvedValue(3);
      ordersQueue.getFailedCount.mockResolvedValue(4);
      ordersQueue.getDelayedCount.mockResolvedValue(5);

      const result = await service.getQueueInfo();

      expect(result).toEqual({
        waiting: 1,
        active: 2,
        completed: 3,
        failed: 4,
        delayed: 5,
      });
    });
  });

  describe('getDlqInfo', () => {
    it('should map dlq jobs correctly', async () => {
      const jobs = [
        {
          id: 'job1',
          data: {
            orderId: '1',
            failedReason: 'error',
          },
          attemptsMade: 3,
          timestamp: 123456,
        },
      ];

      dlqQueue.getJobs.mockResolvedValue(jobs as any);

      const result = await service.getDlqJobs();

      expect(result).toEqual([
        {
          id: 'job1',
          orderId: '1',
          failedReason: 'error',
          attemptsMade: 3,
          timestamp: 123456,
        },
      ]);
    });
  });
});
