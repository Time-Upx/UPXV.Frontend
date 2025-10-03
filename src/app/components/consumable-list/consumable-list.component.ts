import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ConsumableService } from '../../services/consumable.service';
import { AuxService } from '../../services/aux.service';
import { ModalService } from '../../services/modal.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-consumable-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './consumable-list.component.html',
  styleUrls: ['./consumable-list.component.css']
})
export class ConsumableListComponent implements OnInit, OnDestroy {
  consumables: any[] = [];
  units: any[] = [];
  formVisible = false;
  mensagemErro = '';
  mensagemSucesso = '';
  formSubmitted = false;
  carregandoForm = false;
  formGroup: FormGroup;

  // Correção: Adicionada prop para hover effect
  hoverCard = false;

  private subscription: Subscription = new Subscription();

  constructor(
    private consumableService: ConsumableService,
    private auxService: AuxService,
    private fb: FormBuilder,
    private modalService: ModalService
  ) {
    this.formGroup = this.fb.group({
      tid: ['', Validators.required],
      description: [''],
      quantity: [0, [Validators.required, Validators.min(0)]],
      unitNid: ['', Validators.required],
      tagNids: ['']
    });
  }

  ngOnInit() {
    this.loadConsumables();
    this.loadUnits();

    // Escuta confirmações do modal para consumíveis
    this.subscription.add(
      this.modalService.onConfirm().subscribe(item => {
        if (item.type === 'consumable') {
          this.deletar(item.nid);
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  loadConsumables() {
    this.consumableService.listar().subscribe({
      next: (response: any) => {
        this.consumables = response.items || response;
      },
      error: (err) => {
        console.error('Erro API:', err);
        this.mensagemErro = 'Erro ao carregar consumíveis. Tente novamente.';
        this.consumables = [];
        setTimeout(() => this.mensagemErro = '', 5000);
      }
    });
  }

  loadUnits() {
    this.auxService.listarUnits().subscribe({
      next: (data: any) => this.units = data.items || data,
      error: () => {
        this.mensagemErro = 'Erro ao carregar unidades.';
        this.units = [];
        setTimeout(() => this.mensagemErro = '', 3000);
      }
    });
  }

  toggleForm() {
    this.formVisible = !this.formVisible;
    if (!this.formVisible) {
      this.formGroup.reset();
      this.formSubmitted = false;
    }
  }

  criar() {
    this.formSubmitted = true;
    if (this.formGroup.valid) {
      this.carregandoForm = true;
      this.mensagemErro = '';
      const payload = {
        ...this.formGroup.value,
        tagNids: this.formGroup.value.tagNids ? this.formGroup.value.tagNids.split(',').map((id: string) => parseInt(id.trim())).filter((id: number) => !isNaN(id)) : []
      };
      this.consumableService.criar(payload).subscribe({
        next: () => {
          this.mensagemSucesso = 'Consumível criado com sucesso!';
          this.loadConsumables();
          this.toggleForm();
          setTimeout(() => this.mensagemSucesso = '', 3000);
        },
        error: (err) => {
          console.error('Erro ao criar:', err);
          this.mensagemErro = err.error?.message || 'Erro ao criar consumível.';
          setTimeout(() => this.mensagemErro = '', 5000);
        },
        complete: () => this.carregandoForm = false
      });
    }
  }

  confirmarDeletar(nid: number, tid: string) {
    this.modalService.showConfirmation(
      'Excluir Consumível',
      `Deseja realmente excluir o item "${tid}"?`,
      { nid, tid, type: 'consumable' }
    );
  }

  deletar(nid: number) {
    this.consumableService.deletar(nid).subscribe({
      next: () => {
        this.mensagemSucesso = 'Consumível deletado com sucesso!';
        this.loadConsumables();
        setTimeout(() => this.mensagemSucesso = '', 3000);
      },
      error: (err) => {
        console.error('Erro ao deletar:', err);
        this.mensagemErro = err.error?.message || 'Erro ao deletar consumível.';
        setTimeout(() => this.mensagemErro = '', 5000);
      }
    });
  }
}