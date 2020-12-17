import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import AppError from '@shared/errors/AppError';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({
      name,
      price,
      quantity,
    });

    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const foundProduct = await this.ormRepository.findOne({
      where: { name },
    });

    return foundProduct;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const productIdList = products.map(product => product.id);

    const productsList = await this.ormRepository.find({
      where: {
        id: In(productIdList),
      },
    });

    if (productIdList.length !== productsList.length) {
      throw new AppError('Some products are not found.');
    }

    return productsList;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const productIdList = products.map(product => product.id);

    const productsList = await this.ormRepository.find({
      where: {
        id: In(productIdList),
      },
    });

    return Promise.all(
      productsList.map(async prod => {
        const product = products.find(p => p.id === prod.id);

        if (product) {
          const p = prod;
          p.quantity = prod.quantity - product.quantity;

          await this.ormRepository.save(p);

          return p;
        }

        return prod;
      }),
    );
  }
}

export default ProductsRepository;
