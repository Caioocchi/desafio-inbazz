import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from '../services/orders.service';
import { CreateOrderDto } from '../dto/orders.dto';
import { FilterOrdersDto } from '../dto/filter-orders.dto';

describe('OrdersController', () => {
  let ordersController: OrdersController;
  let ordersService: jest.Mocked<OrdersService>;

  const ordersServiceMock = {
    receiveOrder: jest.fn(),
    getOrders: jest.fn(),
    getOrderById: jest.fn(),
    getQueueInfo: jest.fn(),
    getDlqJobs: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: OrdersService,
          useValue: ordersServiceMock,
        },
      ],
    }).compile();

    ordersController = module.get<OrdersController>(OrdersController);
    ordersService = module.get(OrdersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('receiveOrder', () => {
    it('should call service.receiveOrder and return result', async () => {
      const dto = {
        customer: { name: 'Caio', email: 'caio@inbazz.com', cep: '29102035' },
        items: [{ sku: '123abc', qty: 1, unit_price: 100 }],
        currency: 'BRL',
      } as CreateOrderDto;
      const mockResponse = { success: true };

      ordersService.receiveOrder.mockResolvedValue(mockResponse as any);

      const result = await ordersController.receiveOrder(dto);

      expect(ordersService.receiveOrder).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getOrders', () => {
    it('should call service.getOrders and return result', async () => {
      const status = { status: 'RECEIVED' } as FilterOrdersDto;
      const mockOrders = { count: 1, orders: CreateOrderDto };

      ordersService.getOrders.mockResolvedValue(mockOrders as any);

      const result = await ordersController.getOrders(status);

      expect(ordersService.getOrders).toHaveBeenCalledWith(status);
      expect(result).toEqual(mockOrders);
    });
  });

  describe('getOrderById', () => {
    it('should return order when found', async () => {
      const mockOrder = { id: '1' };

      ordersService.getOrderById.mockResolvedValue(mockOrder as any);

      const result = await ordersController.getOrderById(mockOrder.id);

      expect(ordersService.getOrderById).toHaveBeenCalledWith(mockOrder.id);
      expect(result).toEqual(mockOrder);
    });

    it('should throw NotFoundException when order not found', async () => {
      const order_id = '';
      ordersService.getOrderById.mockResolvedValue(null);

      await expect(ordersController.getOrderById(order_id)).rejects.toThrow(
        NotFoundException,
      );

      expect(ordersService.getOrderById).toHaveBeenCalledWith(order_id);
    });
  });

  describe('getQueueInfo', () => {
    it('should return queue metrics', async () => {
      const mockMetrics = { waiting: 2, failed: 1 };

      ordersService.getQueueInfo.mockResolvedValue(mockMetrics as any);

      const result = await ordersController.getQueueInfo();

      expect(ordersService.getQueueInfo).toHaveBeenCalled();
      expect(result).toEqual(mockMetrics);
    });
  });

  describe('getDlq', () => {
    it('should return dlq jobs', async () => {
      const mockDlq = [{ id: 'job1', failedReason: 'error' }];

      ordersService.getDlqJobs.mockResolvedValue(mockDlq as any);

      const result = await ordersController.getDlq();

      expect(ordersService.getDlqJobs).toHaveBeenCalled();
      expect(result).toEqual(mockDlq);
    });
  });
});
