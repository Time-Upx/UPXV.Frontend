import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UtilsService } from '../../services/utils.service';
import { ModalService } from '../../services/modal.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-status-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './status-list.component.html',
  styleUrls: ['./status-list.component.css']
})
export class StatusListComponent implements OnInit {
  statuses: any[] = [];
  mensagemErro = '';
  mensagemSucesso = '';
  formGroup: FormGroup;
  editModeId: number | null = null;
  carregandoForm = false;
  formSubmitted = false;

  hoverCard = false;

  private subscription: Subscription = new Subscription();

  constructor(
    private utilsService: UtilsService,
    private modalService: ModalService,
    private fb: FormBuilder
  ) {
    this.formGroup = this.fb.group({
      tid: ['', Validators.required],
      description: ['']
    });
  }

  ngOnInit() {
    this.loadStatuses();
    this.subscription.add(
      this.modalService.onConfirm().subscribe(item => {
        if (item.type === 'status') {
          this.deletar(item.nid);
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  loadStatuses() {
    this.utilsService.listarStatuses().subscribe({
      next: (data: any) => this.statuses = data.items || data,
      error: () => this.mensagemErro = 'Erro ao carregar status.'
    });
  }

  toggleEdit(nid: number | null) {
    this.editModeId = nid;
    this.formSubmitted = false;
    if (nid) {
      const status = this.statuses.find(s => s.nid === nid);
      this.formGroup.patchValue({
        tid: status.tid,
        description: status.description
      });
    } else {
      this.formGroup.reset();
    }
  }

  salvar(nid: number | null) {
    this.formSubmitted = true;
    if (this.formGroup.valid) {
      this.carregandoForm = true;
      const payload = this.formGroup.value;
      if (nid) {
        payload.nid = nid;
        this.utilsService.atualizarStatus(payload).subscribe({
          next: () => {
            this.mensagemSucesso = 'Status atualizado!';
            this.loadStatuses();
            this.toggleEdit(null);
            setTimeout(() => this.mensagemSucesso = '', 3000);
          },
          error: () => this.mensagemErro = 'Erro ao atualizar status.',
          complete: () => this.carregandoForm = false
        });
      } else {
        this.utilsService.adicionarStatus(payload).subscribe({
          next: () => {
            this.mensagemSucesso = 'Status adicionado!';
            this.loadStatuses();
            this.toggleEdit(null);
            setTimeout(() => this.mensagemSucesso = '', 3000);
          },
          error: () => this.mensagemErro = 'Erro ao adicionar status.',
          complete: () => this.carregandoForm = false
        });
      }
    }
  }

  confirmarDeletar(nid: number, tid: string) {
    this.utilsService.checkStatusUsage(nid).subscribe({
      next: (data: any) => {
        if (data.items.length > 0) {
          this.mensagemErro = 'Status em uso por patrimônios. Não pode ser deletado.';
          setTimeout(() => this.mensagemErro = '', 3000);
          return;
        }
        this.modalService.showConfirmation(
          'Excluir Status',
          `Deseja excluir o status "${tid}"?`,
          { nid, tid, type: 'status' }
        );
      },
      error: () => this.mensagemErro = 'Erro ao verificar uso do status.'
    });
  }

  deletar(nid: number) {
    this.utilsService.deletarStatus(nid).subscribe({
      next: () => {
        this.mensagemSucesso = 'Status excluído!';
        this.loadStatuses();
        setTimeout(() => this.mensagemSucesso = '', 3000);
      },
      error: (err) => {
        this.mensagemErro = err.error?.message || 'Erro ao excluir status.';
        setTimeout(() => this.mensagemErro = '', 5000);
      }
    });
  }
}