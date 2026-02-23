import { validate } from 'class-validator';
import { CreateOrderDto } from './orders.dto';
import { plainToInstance } from 'class-transformer';

it('should validate a correct DTO', async () => {
  const dto = {
    customer: {
      name: 'Caio',
      email: 'caio@inbazz.com',
      cep: '29102035',
    },
    items: [
      {
        sku: '123abc',
        qty: 0,
        unit_price: 0,
      },
    ],
    currency: 'BRL',
  };

  const errors = await validate(plainToInstance(CreateOrderDto, dto));

  expect(errors.length).toBe(0);
});
