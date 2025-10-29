import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ConsumableService, Consumable, ConsumableCreateDTO } from '../../services/consumable.service';
import { UtilsService, PageDTO, Unit } from '../../services/utils.service';
import { ModalService, ModalActionItem } from '../../services/modal.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-consumable-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './consumable-list.component.html',
  styleUrls: ['./consumable-list.component.css']
})
export class ConsumableListComponent implements OnInit, OnDestroy {
  consumables: Consumable[] = [];
  units: Unit[] = [];
  formVisible = false;
  mensagemErro = '';
  mensagemSucesso = '';
  formSubmitted = false;
  carregandoForm = false;
  formGroup: FormGroup;

  private subscription = new Subscription();

  constructor(
    private consumableService: ConsumableService,
    private utilsService: UtilsService,
    private fb: FormBuilder,
    private modalService: ModalService
  ) {
    this.formGroup = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      quantity: [0, [Validators.required, Validators.min(0.01)]],
      unitId: ['', Validators.required],
      tagIds: ['']
    });
  }

  ngOnInit() {
    this.loadConsumables();
    this.loadUnits();

    this.subscription.add(
      this.modalService.onConfirm().subscribe((item: ModalActionItem) => {
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
    this.consumableService.listar(0, 20).subscribe({
      next: (page: PageDTO<Consumable>) => {
        this.consumables = page.items;
      },
      error: () => {
        this.mensagemErro = 'Erro ao carregar consumíveis.';
        this.consumables = [];
        setTimeout(() => this.mensagemErro = '', 5000);
      }
    });
  }

  loadUnits() {
    this.utilsService.listarUnits(0, 100).subscribe({
      next: (page: PageDTO<Unit>) => this.units = page.items,
      error: () => {
        this.mensagemErro = 'Erro ao carregar unidades.';
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
      const payload: ConsumableCreateDTO = {
        name: this.formGroup.value.name,
        description: this.formGroup.value.description,
        quantity: +this.formGroup.value.quantity,
        unitId: +this.formGroup.value.unitId,
        tagIds: this.formGroup.value.tagIds
          ? this.formGroup.value.tagIds.split(',').map((s: string) => parseInt(s.trim())).filter((n: any) => !isNaN(n))
          : []
      };

      this.consumableService.criar(payload).subscribe({
        next: () => {
          this.mensagemSucesso = 'Consumível criado com sucesso!';
          this.loadConsumables();
          this.toggleForm();
          setTimeout(() => this.mensagemSucesso = '', 3000);
        },
        error: (err) => {
          this.mensagemErro = err.error?.message || 'Erro ao criar consumível.';
          setTimeout(() => this.mensagemErro = '', 5000);
        },
        complete: () => this.carregandoForm = false
      });
    }
  }

  confirmarDeletar(id: number, name: string) {
    this.modalService.showConfirmation(
      'Excluir Consumível',
      `Deseja realmente excluir "<strong>${name}</strong>"?`,
      { nid: id, name, type: 'consumable' }
    );
  }

  deletar(id: number) {
    this.consumableService.deletar(id).subscribe({
      next: () => {
        this.mensagemSucesso = 'Consumível excluído!';
        this.loadConsumables();
        setTimeout(() => this.mensagemSucesso = '', 3000);
      },
      error: () => {
        this.mensagemErro = 'Erro ao excluir consumível.';
        setTimeout(() => this.mensagemErro = '', 5000);
      }
    });
  }
}