import React, { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MdModeEdit } from 'react-icons/md';
import { BsFillTrash3Fill } from 'react-icons/bs';
import { Form } from '@unform/web';
import * as Yup from 'yup';

import api from '~/services';

import { Container, Table, Toggle, Modal } from './styles';
import Pagination from '~/components/Pagination';
import Input from '~/components/Input';
import InputMask from '~/components/InputMask';
import Select, { IOption } from '~/components/Select';
import { FormHandles } from '@unform/core';
import getValidationErros from '~/utils/getValidationsErrors';
import Swal from 'sweetalert2';
import Toast from '~/utils/toast';

interface IUserResponse {
  id: string;
  nome: string;
  email: string;
  rua: string;
  numero: string;
  bairro: string;
  complemento: string;
  cidade: string;
  estado: string;
  cep: string;
  status: string;
}

interface IResponseData {
  data: IUserResponse[];
  from: number;
  to: number;
  total: number;
  pages: number;
}

interface IUser {
  id: string;
  name: string;
  email: string;
  address: string;
  status: string;
}

interface IFormData {
  id?: string;
  name: string;
  email: string;
  zipcode: string;
  street: string;
  number: string;
  state: string;
  city: string;
  neighborhood: string;
  complement: string;
  status: string;
}

const Users: React.FC = () => {
  const formRef = useRef<FormHandles>(null);
  const [users, setUsers] = useState<IUser[]>([]);
  const [show, setShow] = useState(false);
  const [userSelected, setUserSelected] = useState({} as IFormData);
  const [inUpdate, setInUpdate] = useState(false);
  const [pageSelected, setPageSelected] = useState(1);
  const [tableData, setTableData] = useState({
    from: 1,
    to: 1,
    total: 1,
    pages: 1,
  });

  const states = useMemo<IOption[]>(() => [
    {id: "AC", value: "Acre", selected: userSelected.state === "AC" },
    {id: "AL", value: "Alagoas", selected: userSelected.state === "AL" },
    {id: "AP", value: "Amapá", selected: userSelected.state === "AP" },
    {id: "AM", value: "Amazonas", selected: userSelected.state === "AM" },
    {id: "BA", value: "Bahia", selected: userSelected.state === "BA" },
    {id: "CE", value: "Ceará", selected: userSelected.state === "CE" },
    {id: "DF", value: "Distrito Federal", selected: userSelected.state === "DF" },
    {id: "ES", value: "Espírito Santo", selected: userSelected.state === "ES" },
    {id: "GO", value: "Goiás", selected: userSelected.state === "GO" },
    {id: "MA", value: "Maranhão", selected: userSelected.state === "MA" },
    {id: "MT", value: "Mato Grosso", selected: userSelected.state === "MT" },
    {id: "MS", value: "Mato Grosso do Sul", selected: userSelected.state === "MS" },
    {id: "MG", value: "Minas Gerais", selected: userSelected.state === "MG" },
    {id: "PA", value: "Pará", selected: userSelected.state === "PA" },
    {id: "PB", value: "Paraíba", selected: userSelected.state === "PB" },
    {id: "PR", value: "Paraná", selected: userSelected.state === "PR" },
    {id: "PE", value: "Pernambuco", selected: userSelected.state === "PE" },
    {id: "PI", value: "Piauí", selected: userSelected.state === "PI" },
    {id: "RJ", value: "Rio de Janeiro", selected: userSelected.state === "RJ" },
    {id: "RN", value: "Rio Grande do Norte", selected: userSelected.state === "RN" },
    {id: "RS", value: "Rio Grande do Sul", selected: userSelected.state === "RS" },
    {id: "RO", value: "Rondônia", selected: userSelected.state === "RO" },
    {id: "RR", value: "Roraima", selected: userSelected.state === "RR" },
    {id: "SC", value: "Santa Catarina", selected: userSelected.state === "SC" },
    {id: "SP", value: "São Paulo", selected: userSelected.state === "SP" },
    {id: "SE", value: "Sergipe", selected: userSelected.state === "SE" },
    {id: "TO", value: "Tocantins", selected: userSelected.state === "TO" }
  ], [userSelected]);

  const handleLoadUsers = useCallback(async (page = 1) => {
    const response = await api.get<IResponseData>('users', {
      params: {
        page,
      }
    });

    const data = response.data.data.map<IUser>((user) => ({
      id: user.id,
      name: user.nome,
      email: user.email,
      address: `${user.rua}, ${user.numero} - ${user.bairro}, ${user.cidade} - ${user.estado} CEP: ${user.cep}`,
      status: user.status,
    }))

    setUsers(data);
    setTableData({
      from: response.data.from,
      to: response.data.to,
      total: response.data.total,
      pages: response.data.pages
    })
  }, []);

  useEffect(() => {
    handleLoadUsers();
  }, [handleLoadUsers]);

  const handleChangePage = useCallback(async (page: number) => {
    await handleLoadUsers(page);
    setPageSelected(page);
  }, [handleLoadUsers])

  const handleClickAddUser = useCallback(() => {
    setShow(true);
  }, []);

  const handleClose = useCallback(() => {
    setShow(false);
    setInUpdate(false);
    setUserSelected({} as IFormData);
  }, []);

  const handleChangeZipCode = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.value.length === 9) {
        const response = await api.get(
          `https://viacep.com.br/ws/${e.target.value}/json/`
        );
        if (response.data) {
          setUserSelected({
            ...userSelected,
            zipcode: response.data.cep,
            street: response.data.logradouro,
            state: response.data.uf,
            city: response.data.localidade,
            neighborhood: response.data.bairro,
            complement: response.data.complemento
          })
        }
      }
    },
    []
  );

  const handleClickEditUser = useCallback(async (user_id: string) => {
    const response = await api.get<IUserResponse>(`users/${user_id}`);
    setUserSelected({
      id: response.data.id,
      name: response.data.nome,
      email: response.data.email,
      zipcode: response.data.cep,
      street: response.data.rua,
      number: response.data.numero,
      state: response.data.estado,
      city: response.data.cidade,
      neighborhood: response.data.bairro,
      complement: response.data.complemento,
      status: response.data.status
    })
    setInUpdate(true);
    setShow(true);
  }, [])

  const handleSubmit = useCallback(
    async (data: IFormData) => {
      try {
        formRef.current?.setErrors({});

        const schema = Yup.object().shape({
          name: Yup.string().required('O nome é obrigatório'),
          email: Yup.string().email().required('O e-mail é obrigatório'),
          zipcode: Yup.string().required('O CEP é obrigatório'),
          street: Yup.string().required('A rua é obrigatória'),
          number: Yup.string().required('O número é obrigatório'),
          state: Yup.string().required('O estado é obrigatório'),
          city: Yup.string().required('A cidade é obrigatória'),
          neighborhood: Yup.string().required('O bairro é obrigatório'),
          complement: Yup.string(),
          status: Yup.string(),
        });

        await schema.validate(data, {
          abortEarly: false,
        });

        const formData = {
          nome: data.name,
          email: data.email,
          rua: data.street,
          numero: data.number,
          bairro: data.neighborhood,
          complemento: data.complement,
          cidade: data.city,
          estado: data.state,
          cep: data.zipcode,
          status: data.status
        }

        if (inUpdate) {
          await api.put(`users/${userSelected.id}`, formData);
          const newUsers = users.slice();
          const index = newUsers.findIndex(user => user.id === userSelected.id);
          if(index >= 0){
            newUsers[index].name = data.name;
            newUsers[index].email = data.email;
            newUsers[index].address = `${data.street}, ${data.number} - ${data.neighborhood}, ${data.city} - ${data.state} CEP: ${data.zipcode}`;
            newUsers[index].status = data.status;
          }
          setUsers(newUsers);
        } else {
          await api.post('users',
            formData
          );
          handleLoadUsers(pageSelected);
        }

        Toast.fire({
          icon: 'success',
          iconColor: '#ec6724',
          title: `Usuário ${inUpdate ? 'editado' : 'criado'} com sucesso`,
        });

        handleClose();
      } catch (error) {
        if (error instanceof Yup.ValidationError) {
          const errors = getValidationErros(error);
          formRef.current?.setErrors(errors);
        } else {
          Swal.fire('Oops...', 'Ocorreu um erro tente novamente, por favor');
        }
      }
    },
    [inUpdate, pageSelected, users, userSelected, handleClose]
  );

  const handleClickDeleteUser = useCallback(async (user_id: string) => {
    Swal.fire({
      title: 'Tem certeza?',
      text: "Voce nao podera reverter isso!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ec6724',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sim, deletar!',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then(async (result) => {
    if (result.isConfirmed) {
      await api.delete(`users/${user_id}`);
      handleLoadUsers(pageSelected);
      Toast.fire({
        icon: 'success',
        iconColor: '#ec6724',
        title: 'Usuário deletado com sucesso',
      })
    }
    }).catch((error) => {
      console.log(error);
      Toast.fire({
      icon: 'error',
      iconColor: '#ec6724',
      title: 'Ocorreu um erro, tente novamente',
    })
    })
  }, [pageSelected]);

  const handleChangeStatus = useCallback(async (user_id: string, status: string) => {
    const newUsers = users.slice();
    const index = newUsers.findIndex(user => user.id === user_id);
    console.log(index);
    if(index >= 0){
      newUsers[index].status = status === 'ativo' ? 'inativo' : 'ativo';
    }
    setUsers(newUsers);
    await api.patch(`users/${user_id}`, { status: status === 'ativo' ? 'inativo' : 'ativo' });
  }, [users]);

  return (
    <Container className="py-4">
      <div className="container">
        <div className="row justify-content-between align-items-center">
          <div className="col-5"><h1 className='mb-0'>Usuários</h1></div>
          <div className="col-7 text-end">
            <button type="button" className='btn btn-primary' onClick={handleClickAddUser}>Adicionar usuário</button>
          </div>
          <div className="col-12 mt-3">
            <Table>
              <div className="header d-none d-md-flex">
                <div className="table-row">
                  <div className="table-cell">Nome</div>
                  <div className="table-cell">E-mail</div>
                  <div className="table-cell">Endereço</div>
                  <div className="table-cell">Status</div>
                  <div className="table-cell"></div>
                </div>
              </div>
              <div className="body">
                {users.length === 0 && (
                  <div className="w-100 d-flex align-items-center justify-content-center py-5">
                    <span className="text-center">Nenhum usuário cadastrado</span>
                  </div>
                )}
                {users.map(user => (
                  <div key={user.id} className="table-row">
                  <div className="table-cell text-center text-md-start">
                    <span className='d-block d-md-none fw-bold'>Nome</span>
                    {user.name}
                  </div>
                  <div className="table-cell text-center text-md-start">
                    <span className='d-block d-md-none fw-bold'>E-mail</span>
                    {user.email}
                  </div>
                  <div className="table-cell text-center text-md-start">
                    <span className='d-block d-md-none fw-bold'>Endereço</span>
                    {user.address}
                  </div>
                  <div className="table-cell text-center text-md-start">
                    <span className='d-block d-md-none fw-bold'>Status</span>
                    <Toggle
                      active={user.status === 'ativo'}
                      onClick={() => handleChangeStatus(user.id, user.status)}
                    >
                      <div />
                    </Toggle>
                  </div>
                  <div className="table-cell text-center text-md-start">
                    <div className="d-flex justify-content-end">
                      <button
                        type="button"
                        className='btn btn-primary rounded-circle d-flex align-items-center justify-content-center'
                        onClick={() => handleClickEditUser(user.id)}
                      >
                          <MdModeEdit size={20} color='#fff' />
                      </button>
                      <button
                        type="button"
                        className='btn btn-delete rounded-circle d-flex align-items-center justify-content-center ms-2'
                        onClick={() => handleClickDeleteUser(user.id)}
                      >
                        <BsFillTrash3Fill size={20} color='#fff' />
                      </button>
                    </div>
                  </div>
                </div>
                ))}
              </div>
            </Table>
            {users.length > 0 && (
              <Pagination currentPage={pageSelected} totalPages={tableData.pages} onChangePage={handleChangePage}  />
            )}
          </div>
        </div>
      </div>
      <Modal show={show} onHide={handleClose} size="lg">
        <Form
          ref={formRef}
          initialData={userSelected}
          onSubmit={handleSubmit}
          className='p-4'
        >
          <Modal.Header className='border-0'>
            <Modal.Title>{inUpdate ? 'Editar' : 'Novo'} Usuário</Modal.Title>
            <button
              type="button"
              onClick={handleClose}
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            />
          </Modal.Header>
          <Modal.Body>
            <div className="row">
              <div className="col-12">
                <h2 className='h5'>Dados Pessoais</h2>
                <div className="row">
                  <div className="col-lg-6">
                    <label className="d-block w-100 mb-3">
                      <span className='d-block w-100 mb-2'>Nome</span>
                      <Input name='name' />
                    </label>
                  </div>
                  <div className="col-lg-6">
                    <label className="d-block w-100 mb-3">
                      <span className='d-block w-100 mb-2'>E-mail</span>
                      <Input type='email' name='email' />
                    </label>
                  </div>
                </div>
              </div>
              <hr className='my-3' />
              <div className="col-12">
                <h2 className='h5'>Endereço</h2>
                <div className="row">
                  <div className="col-lg-3">
                    <label className="d-block w-100 mb-3">
                      <span className='d-block w-100 mb-2'>CEP</span>
                      <InputMask
                        kind="zip-code"
                        name='zipcode'
                        onChange={handleChangeZipCode}
                        value={userSelected.zipcode}
                      />
                    </label>
                  </div>
                  <div className="col-lg-9">
                    <label className="d-block w-100 mb-3">
                      <span className='d-block w-100 mb-2'>Rua</span>
                      <Input name='street' />
                    </label>
                  </div>
                  <div className="col-lg-2">
                    <label className="d-block w-100 mb-3">
                      <span className='d-block w-100 mb-2'>Número</span>
                      <Input name='number' />
                    </label>
                  </div>
                  <div className="col-lg-5">
                    <label className="d-block w-100 mb-3">
                      <span className='d-block w-100 mb-2'>Estado</span>
                      <Select name='state' options={states} />
                    </label>
                  </div>
                  <div className="col-lg-5">
                    <label className="d-block w-100 mb-3">
                      <span className='d-block w-100 mb-2'>Cidade</span>
                      <Input name='city' />
                    </label>
                  </div>
                  <div className="col-lg-6">
                    <label className="d-block w-100 mb-3">
                      <span className='d-block w-100 mb-2'>Bairro</span>
                      <Input name='neighborhood' />
                    </label>
                  </div>
                  <div className="col-lg-6">
                    <label className="d-block w-100 mb-3">
                      <span className='d-block w-100 mb-2'>Complemento</span>
                      <Input name='complement' />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer className='border-0'>
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-secondary"
            >
              Fechar
            </button>
            <button type="submit" className="btn btn-primary">Salvar</button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}

export default Users;
