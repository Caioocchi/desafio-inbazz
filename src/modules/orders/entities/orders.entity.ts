import { OrderStatus } from 'src/common/enums/order-status.enum';
import { Entity, PrimaryGeneratedColumn, Column, Index} from 'typeorm';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  order_id!: string;

  @Index({ unique: true })
  @Column({
    type: 'uuid',
    default: () => 'gen_random_uuid()',
  })
  idempotency_key!: string;

  @Column({ type: 'jsonb' })
  customer!: {
    email: string;
    name: string;
    cep: string
    logradouro: string
    complemento: string
    unidade: string
    bairro: string
    localidade: string
    uf: string
    estado: string
  };

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.RECEIVED
  })
  status!: OrderStatus

  @Column({ type: 'jsonb' })
  items!: {
    sku: string;
    qty: number;
    unit_price: number;
  }[];

  @Column()
  currency!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  totalAmount?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  convertedAmount?: number;

  @Column({ nullable: true })
  convertedCurrency?: string;

  @Column({ type: 'text', nullable: true })
  failureReason?: string;
}
