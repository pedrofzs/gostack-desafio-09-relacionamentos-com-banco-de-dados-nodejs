import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import Product from '../infra/typeorm/entities/Product';
import IProductsRepository from '../repositories/IProductsRepository';

interface IRequest {
  name: string;
  price: number;
  quantity: number;
}

@injectable()
class CreateProductService {
  private productsRepository: IProductsRepository;

  constructor(
    @inject('ProductsRepository') productsRepository: IProductsRepository,
  ) {
    this.productsRepository = productsRepository;
  }

  public async execute({ name, price, quantity }: IRequest): Promise<Product> {
    const findProductWithSameName = await this.productsRepository.findByName(
      name,
    );

    if (findProductWithSameName) {
      throw new AppError(`The product ${name} is already been registered.`);
    }

    const product = await this.productsRepository.create({
      name,
      price,
      quantity,
    });

    return product;
  }
}

export default CreateProductService;
