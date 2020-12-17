import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  private ordersRepository: IOrdersRepository;

  private customersRepository: ICustomersRepository;

  private productsRepository: IProductsRepository;

  constructor(
    @inject('OrdersRepository') ordersRepository: IOrdersRepository,
    @inject('CustomersRepository') customersRepository: ICustomersRepository,
    @inject('ProductsRepository') productsRepository: IProductsRepository,
  ) {
    this.ordersRepository = ordersRepository;
    this.customersRepository = customersRepository;
    this.productsRepository = productsRepository;
  }

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const checkIfCustomerExists = await this.customersRepository.findById(
      customer_id,
    );

    if (!checkIfCustomerExists) {
      throw new AppError(
        `The customer id ${customer_id} is not associated with a valid customer.`,
      );
    }

    const existingProducts = await this.productsRepository.findAllById(
      products.map(p => ({ id: p.id })),
    );

    if (existingProducts.length !== products.length) {
      throw new AppError('Some product ids are not registered in database.');
    }

    const orderedProducts = existingProducts.map(prod => {
      const product = products.find(p => p.id === prod.id);

      if (product) {
        if (product.quantity > prod.quantity) {
          throw new AppError(
            `Invalid quantity for product '${prod.name}' (${product.quantity} ordered - ${prod.quantity} in stock)`,
          );
        }
      }

      return {
        product_id: prod.id,
        price: prod.price,
        quantity: product?.quantity || 1,
      };
    });

    const order = await this.ordersRepository.create({
      customer: checkIfCustomerExists,
      products: orderedProducts,
    });

    await this.productsRepository.updateQuantity(products);

    return order;
  }
}

export default CreateOrderService;
