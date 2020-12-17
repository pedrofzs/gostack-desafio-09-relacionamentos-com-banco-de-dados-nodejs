import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import Customer from '../infra/typeorm/entities/Customer';
import ICustomersRepository from '../repositories/ICustomersRepository';

interface IRequest {
  name: string;
  email: string;
}

@injectable()
class CreateCustomerService {
  private customersRepository: ICustomersRepository;

  constructor(
    @inject('CustomersRepository') customersRepository: ICustomersRepository,
  ) {
    this.customersRepository = customersRepository;
  }

  public async execute({ name, email }: IRequest): Promise<Customer> {
    const findCustomerWithSameEmail = await this.customersRepository.findByEmail(
      email,
    );

    if (findCustomerWithSameEmail) {
      throw new AppError(
        'This e-mail is already in use with another customer.',
      );
    }

    const customer = await this.customersRepository.create({
      name,
      email,
    });

    return customer;
  }
}

export default CreateCustomerService;
