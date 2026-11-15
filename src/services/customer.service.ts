import { customerRepository } from '../repositories/customer.repository';
import {
  CreateCustomerInput,
  UpdateCustomerInput,
} from '../models/customer.model';
import { AppError } from '../errors/app-error';

export const customerService = {
  list() {
    return customerRepository.findAll();
  },

  async getById(id: number) {
    const customer = await customerRepository.findById(id);
    if (!customer) throw new AppError('Cliente não encontrado', 404);
    return customer;
  },

  async create(input: CreateCustomerInput) {
    // RN01: e-mail único
    if (await customerRepository.findByEmail(input.email)) {
      throw new AppError('E-mail já cadastrado', 409);
    }
    return customerRepository.create(input);
  },

  async update(id: number, input: UpdateCustomerInput) {
    await this.getById(id);
    if (input.email !== undefined) {
      const other = await customerRepository.findByEmail(input.email);
      if (other && other.id !== id) {
        throw new AppError('E-mail já cadastrado', 409);
      }
    }
    return customerRepository.update(id, input);
  },

  async remove(id: number) {
    await this.getById(id);
    // RN06: não remover cliente com pedidos
    if (await customerRepository.existsInOrder(id)) {
      throw new AppError(
        'Cliente não pode ser removido: há pedidos associados',
        409,
      );
    }
    await customerRepository.delete(id);
  },
};
