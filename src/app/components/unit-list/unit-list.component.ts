import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UtilsService } from '../../services/utils.service';
import { ModalService } from '../../services/modal.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-unit-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './unit-list.component.html',
  styleUrls: ['./unit-list.component.css']
})
export class UnitListComponent implements OnInit {
  units: any[] = [];
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
      abbreviation: ['', Validators.required],
      description: ['']
    });
  }

  ngOnInit() {
    this.loadUnits();
    this.subscription.add(
      this.modalService.onConfirm().subscribe(item => {
        if (item.type === 'unit') {
          this.deletar(item.nid);
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  loadUnits() {
    this.utilsService.listarUnits().subscribe({
      next: (data: any) => this.units = data.items || data,
      error: () => this.mensagemErro = 'Erro ao carregar unidades.'
    });
  }

  toggleEdit(nid: number | null) {
    this.editModeId = nid;
    this.formSubmitted = false;
    if (nid) {
      const unit = this.units.find(u => u.nid === nid);
      this.formGroup.patchValue({
        tid: unit.tid,
        abbreviation: unit.abbreviation,
        description: unit.description
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
        this.utilsService.atualizarUnit(payload).subscribe({
          next: () => {
            this.mensagemSucesso = 'Unidade atualizada!';
            this.loadUnits();
            this.toggleEdit(null);
            setTimeout(() => this.mensagemSucesso = '', 3000);
          },
          error: () => this.mensagemErro = 'Erro ao atualizar unidade.',
          complete: () => this.carregandoForm = false
        });
      } else {
        this.utilsService.adicionarUnit(payload).subscribe({
          next: () => {
            this.mensagemSucesso = 'Unidade adicionada!';
            this.loadUnits();
            this.toggleEdit(null);
            setTimeout(() => this.mensagemSucesso = '', 3000);
          },
          error: () => this.mensagemErro = 'Erro ao adicionar unidade.',
          complete: () => this.carregandoForm = false
        });
      }
    }
  }

  confirmarDeletar(nid: number, tid: string) {
    this.utilsService.checkUnitUsage(nid).subscribe({
      next: (data: any) => {
        if (data.items.length > 0) {
          this.mensagemErro = 'Unidade em uso por consumíveis. Não pode ser deletada.';
          setTimeout(() => this.mensagemErro = '', 3000);
          return;
        }
        this.modalService.showConfirmation(
          'Excluir Unidade',
          `Deseja excluir a unidade "${tid}"?`,
          { nid, tid, type: 'unit' }
        );
      },
      error: () => this.mensagemErro = 'Erro ao verificar uso da unidade.'
    });
  }

  deletar(nid: number) {
    this.utilsService.deletarUnit(nid).subscribe({
      next: () => {
        this.mensagemSucesso = 'Unidade excluída!';
        this.loadUnits();
        setTimeout(() => this.mensagemSucesso = '', 3000);
      },
      error: (err) => {
        this.mensagemErro = err.error?.message || 'Erro ao excluir unidade.';
        setTimeout(() => this.mensagemErro = '', 5000);
      }
    });
  }
}