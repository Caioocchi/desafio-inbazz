import { Injectable, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ViaCepService {
  constructor(private readonly httpService: HttpService) {}

  async validateCep(cep: string) {
    const cleanedCep = cep.replace(/\D/g, '');

    if (cleanedCep.length !== 8) {
      throw new BadRequestException('CEP inválido');
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(`https://viacep.com.br/ws/${cleanedCep}/json/`)
      );

      if (response.data.erro) {
        throw new BadRequestException('CEP não encontrado');
      }

      return response.data;
    } catch (error) {
      throw new BadRequestException('Erro ao consultar ViaCEP');
    }
  }
}
