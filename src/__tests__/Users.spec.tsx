import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import Users from '~/pages/Users';
import api from '~/services';
import Toast from '~/utils/toast';
import Swal from 'sweetalert2';

vi.mock('~/services', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('~/utils/toast', () => ({
  default: {
    fire: vi.fn(),
  },
}));

vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn(),
  },
}));

const mockUsersResponse = {
  data: [
    {
      id: 'user-1',
      nome: 'John Doe',
      email: 'john@example.com',
      rua: 'Rua Exemplo',
      numero: '123',
      bairro: 'Centro',
      complemento: 'Apto 4',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '12345-678',
      status: 'ativo',
    },
  ],
  from: 1,
  to: 1,
  total: 1,
  pages: 1,
};

const mockSingleUserResponse = mockUsersResponse.data[0];

describe('Página: Users', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (api.get as Mock).mockImplementation((url: string) => {
      if (url.startsWith('users') && !url.includes('users/')) {
        return Promise.resolve({ data: mockUsersResponse });
      }
      if (url.includes(`users/${mockSingleUserResponse.id}`)) {
        return Promise.resolve({ data: mockSingleUserResponse });
      }
      if (url.includes('viacep.com.br')) {
        return Promise.resolve({
          data: {
            cep: '12345-678',
            logradouro: 'Rua Exemplo',
            uf: 'SP',
            localidade: 'São Paulo',
            bairro: 'Centro',
            complemento: 'Apto 4',
          },
        });
      }
      return Promise.reject(new Error(`API GET call to ${url} not mocked`));
    });
  });

  it('Deve renderizar a tabela e carregar os dados iniciais', async () => {
    render(<Users />);

    expect(await screen.findByText('John Doe')).toBeInTheDocument();
    expect(await screen.findByText('john@example.com')).toBeInTheDocument();
    expect(await screen.findByText('Rua Exemplo, 123 - Centro, São Paulo - SP CEP: 12345-678')).toBeInTheDocument();
  });

  it('Deve abrir o modal, preencher, e criar um novo usuário', async () => {
    (api.get as Mock).mockImplementation((url: string) => {
      if (url.startsWith('users') && !url.includes('users/')) {
        return Promise.resolve({ data: { ...mockUsersResponse, data: [] } });
      }
      if (url.includes('viacep.com.br')) {
        return Promise.resolve({
          data: {
            cep: '98765-432',
            logradouro: 'Rua Nova',
            uf: 'RJ',
            localidade: 'Rio de Janeiro',
            bairro: 'Jardins',
            complemento: 'Apto 5',
          },
        });
      }
      return Promise.reject(new Error('not found'));
    });
    (api.post as Mock).mockResolvedValue({ data: {} });

    const user = userEvent.setup();
    render(<Users />);

    await user.click(screen.getByRole('button', { name: /adicionar usuário/i }));
    const modal = await screen.findByRole('dialog');

    await user.type(within(modal).getByLabelText(/nome/i), 'Jane Doe');
    await user.type(within(modal).getByLabelText(/e-mail/i), 'jane@example.com');
    await user.type(within(modal).getByLabelText(/cep/i), '98765-432');
    await user.click(within(modal).getByLabelText(/estado/i));
    await user.click(await screen.findByText('Rio de Janeiro'));
    await user.type(within(modal).getByLabelText(/número/i), '456');
    await user.type(within(modal).getByLabelText(/cidade/i), 'Rio de Janeiro');
    await user.type(within(modal).getByLabelText(/bairro/i), 'Jardins');
    await user.type(within(modal).getByLabelText(/complemento/i), 'Apto 5');
    await user.click(within(modal).getByRole('button', { name: /salvar/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('users', expect.any(Object));
      expect(Toast.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Usuário criado com sucesso',
        }),
      );
    });
  });

  it('Deve abrir o modal em modo de edição e atualizar um usuário', async () => {
    (api.put as Mock).mockResolvedValue({ data: { ...mockSingleUserResponse, nome: 'John Doe Updated' } });
    const user = userEvent.setup();
    render(<Users />);

    const row = await screen.findByText('John Doe');
    await user.click(within(row.closest('.table-row')!).getAllByRole('button')[1]);

    const modal = await screen.findByRole('dialog');
    const nameInput = within(modal).getByLabelText(/nome/i);

    expect(nameInput).toHaveValue('John Doe');

    await user.clear(nameInput);
    await user.type(nameInput, 'John Doe Updated');
    await user.click(within(modal).getByRole('button', { name: /salvar/i }));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith(`users/${mockSingleUserResponse.id}`, expect.any(Object));
      expect(Toast.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Usuário editado com sucesso',
        }),
      );
    });

    expect(await screen.findByText('John Doe Updated')).toBeInTheDocument();
  });

  it('Deve pedir confirmação e excluir um usuário', async () => {
    (Swal.fire as Mock).mockResolvedValue({ isConfirmed: true });
    (api.delete as Mock).mockResolvedValue({});
    const user = userEvent.setup();
    render(<Users />);

    const row = await screen.findByText('John Doe');
    await user.click(within(row.closest('.table-row')!).getAllByRole('button')[2]);

    await waitFor(() => expect(Swal.fire).toHaveBeenCalled());
    await waitFor(() => expect(api.delete).toHaveBeenCalledWith(`users/${mockSingleUserResponse.id}`));
    await waitFor(() =>
      expect(Toast.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Usuário deletado com sucesso',
        }),
      ),
    );
  });

  it('Deve chamar a API com o número da página correto ao clicar na paginação', async () => {
    const user = userEvent.setup();
    const multiPageResponse = {
      ...mockUsersResponse,
      pages: 2,
    };

    (api.get as Mock).mockImplementation((url: string) => {
      if (url.startsWith('users') && !url.includes('users/')) {
        return Promise.resolve({ data: multiPageResponse });
      }
      if (url.includes('viacep.com.br')) {
        return Promise.resolve({
          data: {
            cep: '12345-678',
            logradouro: 'Rua Exemplo',
            uf: 'SP',
            localidade: 'São Paulo',
            bairro: 'Centro',
            complemento: 'Apto 4',
          },
        });
      }
      return Promise.reject(new Error('not found'));
    });

    render(<Users />);

    expect(await screen.findByText('John Doe')).toBeInTheDocument();

    const pageTwoButton = screen.getByRole('button', { name: /2/i });
    await user.click(pageTwoButton);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('users', { params: { page: 2 } });
    });
  });

  it('Deve exibir mensagens de erro no modal ao tentar submeter o formulário vazio', async () => {
    const user = userEvent.setup();
    render(<Users />);

    await user.click(screen.getByRole('button', { name: /adicionar usuário/i }));
    const modal = await screen.findByRole('dialog');
    await user.click(within(modal).getByRole('button', { name: /salvar/i }));

    expect(await within(modal).findByText('O nome é obrigatório')).toBeInTheDocument();
    expect(await within(modal).findByText('O e-mail é obrigatório')).toBeInTheDocument();
    expect(await within(modal).findByText('O CEP é obrigatório')).toBeInTheDocument();
    expect(await within(modal).findByText('A rua é obrigatória')).toBeInTheDocument();
    expect(await within(modal).findByText('O número é obrigatório')).toBeInTheDocument();
    expect(await within(modal).findByText('O estado é obrigatório')).toBeInTheDocument();
    expect(await within(modal).findByText('A cidade é obrigatória')).toBeInTheDocument();
    expect(await within(modal).findByText('O bairro é obrigatório')).toBeInTheDocument();

    expect(api.post).not.toHaveBeenCalled();
    expect(api.put).not.toHaveBeenCalled();
  });

  it('Não deve chamar a API de exclusão se o usuário cancelar a confirmação', async () => {
    (Swal.fire as Mock).mockResolvedValue({ isConfirmed: false });
    const user = userEvent.setup();
    render(<Users />);

    const row = await screen.findByText('John Doe');
    await user.click(within(row.closest('.table-row')!).getAllByRole('button')[2]);

    await waitFor(() => expect(Swal.fire).toHaveBeenCalled());
    expect(api.delete).not.toHaveBeenCalled();
  });

  it('Deve atualizar o status do usuário ao clicar no toggle', async () => {
    (api.patch as Mock).mockResolvedValue({});
    const user = userEvent.setup();
    render(<Users />);

    const row = await screen.findByText('John Doe');
    const toggle = within(row.closest('.table-row')!).getAllByRole('button')[0];
    await user.click(toggle);

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith(`users/${mockSingleUserResponse.id}`, { status: 'inativo' });
    });
  });

  it('Deve preencher o formulário automaticamente ao digitar um CEP válido', async () => {
    const user = userEvent.setup();
    render(<Users />);

    await user.click(screen.getByRole('button', { name: /adicionar usuário/i }));
    const modal = await screen.findByRole('dialog');

    await user.type(within(modal).getByLabelText(/cep/i), '12345-678');

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('https://viacep.com.br/ws/12345-678/json/');
      expect(within(modal).getByLabelText(/rua/i)).toHaveValue('Rua Exemplo');
      expect(within(modal).getByLabelText(/estado/i)).toHaveValue('São Paulo');
      expect(within(modal).getByLabelText(/cidade/i)).toHaveValue('São Paulo');
      expect(within(modal).getByLabelText(/bairro/i)).toHaveValue('Centro');
      expect(within(modal).getByLabelText(/complemento/i)).toHaveValue('Apto 4');
    });
  });
});
