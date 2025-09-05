import { darken } from 'polished';
import styled from 'styled-components';
import { Modal as ModalComponent } from 'react-bootstrap';

interface IToggle {
  active: boolean
}

export const Container = styled.div`
  .btn-delete{
    background-color: #d33;

    :hover{
      background-color: ${darken(0.05, '#d33')}
    }
  }
`;

export const Table = styled.div`
  overflow: hidden;

  .header{
    padding: 10px;
    margin-bottom: 10px;
    background-color: #6161ff;

    .table-cell{
      color: #fff;
    }
  }

  .body{
    padding: 10px;

    .btn{
      width: 35px;
      height: 35px;
      padding: 5px;
    }
  }


  .table-row{
    display: flex;
    flex-direction: column;
    align-items: center;
    border-radius: 10px;
    background-color: #fff;
    border: 1px solid #d9d9d9;
    padding: 10px;

    .table-cell{
      padding: 0 10px;
      width: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;

      + .table-cell{
        border-top: 1px solid #d9d9d9;
        margin-top: 10px;
        padding-top: 10px;
      }
    }

    + .table-row{
      margin-top: 10px;
    }
  }

  @media screen and (min-width: 768px) {
    border-radius: 10px;
    background-color: #fff;
    border: 1px solid #d9d9d9;

    .table-row{
      flex-direction: row;
      width: 100%;
      border-radius: unset;
      background-color: transparent;
      border: unset;
      padding: unset;

      .table-cell{
        display: unset;
        flex: 1;
        width: unset;

       :nth-child(1){
          flex: 2;
        }

        :nth-child(2){
          flex: 2;
        }

        :nth-child(3){
          flex: 3;
        }

        + .table-cell{
          border-top: unset;
          margin-top: unset;
          padding-top: unset;
        }
      }

      + .table-row{
        padding-top: 10px;
        border-top: 1px solid #d9d9d9;
      }
    }

    .body{
      padding-top: 0px;
    }
  }
`;

export const Toggle = styled.button<IToggle>`
  width: 75px;
  height: 30px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  border: 1px solid ${props => props.active ? '#6161ff' : '#202020'};
  border-radius: 50px;
  position: relative;
  background-color: ${props => props.active ? '#6161ff' : 'transparent'};
  transition-duration: 0.3s;

  div{
    background-color: ${props => props.active ? '#fff' : '#202020'};
    border-radius: 50%;
    width: 20px;
    height: 20px;
    position: absolute;
    left: ${props => props.active ? 'calc(100% - 24px)' : '4px'};
    transition-duration: 0.3s;
  }
`;

export const Modal = styled(ModalComponent)`
  .modal-content{
    border-radius: 10px;
  }
`;
